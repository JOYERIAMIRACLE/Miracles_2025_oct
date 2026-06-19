"use client"

import { useEffect, useRef } from "react"

interface Props {
  onEnterZone: (module: string) => void
}

const MAP_W = 1300
const MAP_H = 950

const BUILDINGS = [
  { x: 220,  y: 210,  w: 150, h: 95, icon: "⚔",  label: "VENTAS",       id: "ventas",       r: 16,  g: 185, b: 129 },
  { x: 650,  y: 160,  w: 150, h: 95, icon: "🗺",  label: "PIPELINE",     id: "pipeline",     r: 245, g: 158, b: 11  },
  { x: 1080, y: 210,  w: 150, h: 95, icon: "🏦",  label: "FINANZAS",     id: "finanzas",     r: 59,  g: 130, b: 246 },
  { x: 220,  y: 700,  w: 150, h: 95, icon: "📦",  label: "ALMACÉN",      id: "almacen",      r: 124, g: 58,  b: 237 },
  { x: 650,  y: 750,  w: 150, h: 95, icon: "📢",  label: "MARKETING",    id: "marketing",    r: 236, g: 72,  b: 153 },
  { x: 1080, y: 700,  w: 150, h: 95, icon: "📊",  label: "INDICADORES",  id: "indicadores",  r: 6,   g: 182, b: 212 },
]

export function PhaserGame({ onEnterZone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef      = useRef<{ destroy: (r: boolean) => void } | null>(null)
  const callbackRef  = useRef(onEnterZone)
  callbackRef.current = onEnterZone

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return

    let game: { destroy: (r: boolean) => void } | null = null
    let mounted = true

    ;(async () => {
      const Phaser = (await import("phaser")).default
      if (!mounted || !containerRef.current) return

      /* ── SCENE ── */
      class GameScene extends Phaser.Scene {
        player!:      Phaser.GameObjects.Rectangle
        playerGlow!:  Phaser.GameObjects.Rectangle
        cursors!:     Phaser.Types.Input.Keyboard.CursorKeys
        w!: Phaser.Input.Keyboard.Key
        a!: Phaser.Input.Keyboard.Key
        s!: Phaser.Input.Keyboard.Key
        d!: Phaser.Input.Keyboard.Key
        eKey!:        Phaser.Input.Keyboard.Key
        zones:        Array<{ rect: Phaser.Geom.Rectangle; id: string }> = []
        prompt!:      Phaser.GameObjects.Text
        nearZone:     string | null = null

        constructor() { super({ key: "GameScene" }) }

        create() {
          this.physics.world.setBounds(0, 0, MAP_W, MAP_H)
          this.cameras.main.setBounds(0, 0, MAP_W, MAP_H)

          const gfx = this.add.graphics()

          /* ── Background ── */
          gfx.fillStyle(0x050810)
          gfx.fillRect(0, 0, MAP_W, MAP_H)

          /* ── Grid ── */
          gfx.lineStyle(1, 0x090f1e, 0.6)
          for (let x = 0; x <= MAP_W; x += 48) gfx.lineBetween(x, 0, x, MAP_H)
          for (let y = 0; y <= MAP_H; y += 48) gfx.lineBetween(0, y, MAP_W, y)

          /* ── Roads ── */
          gfx.lineStyle(24, 0x080d1c, 1)
          gfx.lineBetween(0, MAP_H / 2, MAP_W, MAP_H / 2)
          gfx.lineBetween(MAP_W / 2, 0, MAP_W / 2, MAP_H)

          /* ── Road markings ── */
          gfx.lineStyle(1, 0x0d1830, 0.8)
          gfx.lineBetween(0, MAP_H / 2, MAP_W, MAP_H / 2)
          gfx.lineBetween(MAP_W / 2, 0, MAP_W / 2, MAP_H)

          /* ── Paths from buildings to plaza ── */
          const cx = MAP_W / 2, cy = MAP_H / 2
          gfx.lineStyle(10, 0x070c1a, 1)
          BUILDINGS.forEach(b => gfx.lineBetween(b.x, b.y, cx, cy))

          /* ── Center plaza ── */
          gfx.fillStyle(0x060d1c)
          gfx.fillCircle(cx, cy, 90)
          gfx.lineStyle(1, 0x0d1e36, 1)
          gfx.strokeCircle(cx, cy, 90)
          gfx.lineStyle(1, 0x0a172c, 1)
          gfx.strokeCircle(cx, cy, 75)
          this.add.text(cx, cy, "💎\nMIRACLES\nCORP", {
            fontFamily: "monospace", fontSize: "11px",
            color: "#1a3a5c", align: "center",
          }).setOrigin(0.5)

          /* ── Ambient dots ── */
          const dotGfx = this.add.graphics()
          for (let i = 0; i < 60; i++) {
            const dx = Math.random() * MAP_W
            const dy = Math.random() * MAP_H
            const alpha = Math.random() * 0.3 + 0.05
            dotGfx.fillStyle(0x1a3a5c, alpha)
            dotGfx.fillCircle(dx, dy, 1)
          }

          /* ── Buildings ── */
          BUILDINGS.forEach(b => {
            const hex = (b.r << 16) | (b.g << 8) | b.b
            const darkR = Math.floor(b.r * 0.06)
            const darkG = Math.floor(b.g * 0.06)
            const darkB = Math.floor(b.b * 0.06)
            const darkHex = (darkR << 16) | (darkG << 8) | darkB

            /* Shadow */
            gfx.fillStyle(0x000000, 0.6)
            gfx.fillRect(b.x - b.w / 2 + 5, b.y - b.h / 2 + 5, b.w, b.h)

            /* Fill */
            gfx.fillStyle(darkHex)
            gfx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)

            /* Border */
            gfx.lineStyle(1, hex, 0.6)
            gfx.strokeRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)

            /* Top glow line */
            gfx.lineStyle(2, hex, 0.5)
            gfx.lineBetween(b.x - b.w / 2 + 6, b.y - b.h / 2, b.x + b.w / 2 - 6, b.y - b.h / 2)

            /* Door */
            gfx.fillStyle(hex, 0.25)
            gfx.fillRect(b.x - 10, b.y + b.h / 2 - 14, 20, 14)
            gfx.lineStyle(1, hex, 0.4)
            gfx.strokeRect(b.x - 10, b.y + b.h / 2 - 14, 20, 14)

            /* Icon + label */
            this.add.text(b.x, b.y - 10, b.icon, {
              fontFamily: "serif", fontSize: "22px",
            }).setOrigin(0.5)
            this.add.text(b.x, b.y + 16, b.label, {
              fontFamily: "monospace", fontSize: "9px",
              color: `#${hex.toString(16).padStart(6, "0")}`,
              align: "center", letterSpacing: 2,
            }).setOrigin(0.5)

            /* Entry zone (30px padding) */
            this.zones.push({
              rect: new Phaser.Geom.Rectangle(b.x - b.w / 2 - 20, b.y - b.h / 2 - 20, b.w + 40, b.h + 40),
              id: b.id,
            })
          })

          /* ── Player ── */
          const sx = MAP_W / 2, sy = MAP_H / 2 + 110
          this.playerGlow = this.add.rectangle(sx, sy, 22, 26, 0x00d4ff, 0.08)
          this.player = this.add.rectangle(sx, sy, 10, 14, 0x00d4ff)
          this.physics.add.existing(this.player)
          ;(this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true)

          /* ── Input ── */
          this.cursors = this.input.keyboard!.createCursorKeys()
          this.w = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W)
          this.a = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A)
          this.s = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S)
          this.d = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
          this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)

          /* ── Enter prompt ── */
          this.prompt = this.add.text(sx, sy - 30, "[ E ]  ENTRAR", {
            fontFamily: "monospace", fontSize: "10px",
            color: "#00d4ff",
            backgroundColor: "#050810cc",
            padding: { x: 7, y: 4 },
          }).setOrigin(0.5).setAlpha(0).setDepth(10)

          this.tweens.add({
            targets: this.prompt,
            alpha: { from: 0.4, to: 1 },
            duration: 550,
            yoyo: true,
            repeat: -1,
          })

          /* ── Camera ── */
          this.cameras.main.startFollow(this.player, true, 0.09, 0.09)
        }

        update() {
          const body  = this.player.body as Phaser.Physics.Arcade.Body
          const SPEED = 165

          body.setVelocity(0)

          const left  = this.cursors.left.isDown  || this.a.isDown
          const right = this.cursors.right.isDown || this.d.isDown
          const up    = this.cursors.up.isDown    || this.w.isDown
          const down  = this.cursors.down.isDown  || this.s.isDown

          if (left)  body.setVelocityX(-SPEED)
          if (right) body.setVelocityX(SPEED)
          if (up)    body.setVelocityY(-SPEED)
          if (down)  body.setVelocityY(SPEED)
          if ((left || right) && (up || down)) body.velocity.normalize().scale(SPEED)

          /* Sync glow */
          this.playerGlow.setPosition(this.player.x, this.player.y)

          /* Zone detection */
          let found: string | null = null
          for (const z of this.zones) {
            if (z.rect.contains(this.player.x, this.player.y)) { found = z.id; break }
          }

          if (found !== this.nearZone) {
            this.nearZone = found
          }

          if (found) {
            this.prompt.setPosition(this.player.x, this.player.y - 28).setAlpha(this.prompt.alpha || 0.7)
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
              callbackRef.current(found)
            }
          } else {
            this.prompt.setAlpha(0)
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type:   Phaser.AUTO,
        parent: containerRef.current!,
        backgroundColor: "#050810",
        physics: {
          default: "arcade",
          arcade:  { gravity: { x: 0, y: 0 }, debug: false },
        },
        scene: [GameScene],
        scale: {
          mode:       Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
      }

      game = new Phaser.Game(config)
      if (mounted) gameRef.current = game
      else         game.destroy(true)
    })()

    return () => {
      mounted = false
      game?.destroy(true)
      gameRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
