"use client"

import { useEffect, useRef } from "react"

interface Props {
  onEnterZone: (module: string) => void
}

const MAP_W = 1300
const MAP_H = 950

const BUILDINGS = [
  { x: 200,  y: 300, w: 150, h: 95, icon: "🏢", label: "OFICINA RICHI",     id: "oficina-richiavrod",      r: 167, g: 139, b: 250 },
  { x: 200,  y: 475, w: 150, h: 95, icon: "🏬", label: "ALMACÉN RICHI",     id: "almacen-richiavrod",      r: 124, g: 58,  b: 198 },
  { x: 200,  y: 650, w: 150, h: 95, icon: "🧩", label: "TALLER RICHI",      id: "taller-richiavrod",       r: 217, g: 70,  b: 239 },
  { x: 480,  y: 140, w: 150, h: 95, icon: "🏢", label: "OFICINA MEDALLA",   id: "oficina-medallitadeoro",  r: 192, g: 132, b: 252 },
  { x: 820,  y: 140, w: 150, h: 95, icon: "🏬", label: "ALMACÉN MEDALLA",   id: "almacen-medallitadeoro",  r: 147, g: 51,  b: 234 },
  { x: 480,  y: 300, w: 150, h: 95, icon: "🪟", label: "APARADOR",          id: "aparador-medallitadeoro", r: 216, g: 180, b: 254 },
  { x: 820,  y: 300, w: 150, h: 95, icon: "🧩", label: "TALLER MEDALLA",    id: "taller-medallitadeoro",   r: 217, g: 70,  b: 239 },
  { x: 1100, y: 300, w: 150, h: 95, icon: "🏢", label: "OFICINA SDI",       id: "oficina-sdi",             r: 129, g: 140, b: 248 },
  { x: 1100, y: 475, w: 150, h: 95, icon: "🏬", label: "ALMACÉN SDI",       id: "almacen-sdi",             r: 99,  g: 102, b: 241 },
  { x: 1100, y: 650, w: 150, h: 95, icon: "🧩", label: "TALLER SDI",        id: "taller-sdi",              r: 217, g: 70,  b: 239 },
]

/* Sectores — agrupan visualmente los edificios de cada mundo (x/y = esquina superior izquierda) */
const SECTORS = [
  { x: 80,  y: 220, w: 240, h: 500, label: "RICHIAVROD",     r: 167, g: 139, b: 250 },
  { x: 330, y: 70,  w: 640, h: 280, label: "MEDALLITADEORO", r: 192, g: 132, b: 252 },
  { x: 980, y: 220, w: 240, h: 500, label: "SDI PORTAL",     r: 129, g: 140, b: 248 },
]

export function SegundoCerebroGame({ onEnterZone }: Props) {
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

        constructor() { super({ key: "SegundoCerebroScene" }) }

        create() {
          this.physics.world.setBounds(0, 0, MAP_W, MAP_H)
          this.cameras.main.setBounds(0, 0, MAP_W, MAP_H)

          const gfx = this.add.graphics()

          /* ── Background (violeta oscuro) ── */
          gfx.fillStyle(0x0a0714)
          gfx.fillRect(0, 0, MAP_W, MAP_H)

          /* ── Grid ── */
          gfx.lineStyle(1, 0x150f24, 0.6)
          for (let x = 0; x <= MAP_W; x += 48) gfx.lineBetween(x, 0, x, MAP_H)
          for (let y = 0; y <= MAP_H; y += 48) gfx.lineBetween(0, y, MAP_W, y)

          /* ── Roads ── */
          gfx.lineStyle(24, 0x120c1f, 1)
          gfx.lineBetween(0, MAP_H / 2, MAP_W, MAP_H / 2)
          gfx.lineBetween(MAP_W / 2, 0, MAP_W / 2, MAP_H)

          gfx.lineStyle(1, 0x1a1330, 0.8)
          gfx.lineBetween(0, MAP_H / 2, MAP_W, MAP_H / 2)
          gfx.lineBetween(MAP_W / 2, 0, MAP_W / 2, MAP_H)

          /* ── Caminos de edificios a la plaza ── */
          const cx = MAP_W / 2, cy = MAP_H / 2
          gfx.lineStyle(10, 0x0f0a1a, 1)
          BUILDINGS.forEach(b => gfx.lineBetween(b.x, b.y, cx, cy))

          /* ── Plaza central ── */
          gfx.fillStyle(0x0d0818)
          gfx.fillCircle(cx, cy, 90)
          gfx.lineStyle(1, 0x241a3d, 1)
          gfx.strokeCircle(cx, cy, 90)
          gfx.lineStyle(1, 0x1a1330, 1)
          gfx.strokeCircle(cx, cy, 75)
          this.add.text(cx, cy, "🧠\nSEGUNDO\nCEREBRO", {
            fontFamily: "monospace", fontSize: "10px",
            color: "#3d2a63", align: "center",
          }).setOrigin(0.5)

          /* ── Puntos ambientales ── */
          const dotGfx = this.add.graphics()
          for (let i = 0; i < 60; i++) {
            const dx = Math.random() * MAP_W
            const dy = Math.random() * MAP_H
            const alpha = Math.random() * 0.3 + 0.05
            dotGfx.fillStyle(0x3d2a63, alpha)
            dotGfx.fillCircle(dx, dy, 1)
          }

          /* ── Sectores (agrupan los edificios de cada mundo) ── */
          SECTORS.forEach(s => {
            const hex = (s.r << 16) | (s.g << 8) | s.b
            gfx.fillStyle(hex, 0.035)
            gfx.fillRoundedRect(s.x, s.y, s.w, s.h, 18)
            gfx.lineStyle(1, hex, 0.22)
            gfx.strokeRoundedRect(s.x, s.y, s.w, s.h, 18)

            this.add.text(s.x + s.w / 2, s.y + 16, s.label, {
              fontFamily: "monospace", fontSize: "10px",
              color: `#${hex.toString(16).padStart(6, "0")}`,
              align: "center", letterSpacing: 3,
            }).setOrigin(0.5).setAlpha(0.55)
          })

          /* ── Edificios ── */
          BUILDINGS.forEach(b => {
            const hex = (b.r << 16) | (b.g << 8) | b.b
            const darkR = Math.floor(b.r * 0.06)
            const darkG = Math.floor(b.g * 0.06)
            const darkB = Math.floor(b.b * 0.06)
            const darkHex = (darkR << 16) | (darkG << 8) | darkB

            gfx.fillStyle(0x000000, 0.6)
            gfx.fillRect(b.x - b.w / 2 + 5, b.y - b.h / 2 + 5, b.w, b.h)

            gfx.fillStyle(darkHex)
            gfx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)

            gfx.lineStyle(1, hex, 0.6)
            gfx.strokeRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h)

            gfx.lineStyle(2, hex, 0.5)
            gfx.lineBetween(b.x - b.w / 2 + 6, b.y - b.h / 2, b.x + b.w / 2 - 6, b.y - b.h / 2)

            gfx.fillStyle(hex, 0.25)
            gfx.fillRect(b.x - 10, b.y + b.h / 2 - 14, 20, 14)
            gfx.lineStyle(1, hex, 0.4)
            gfx.strokeRect(b.x - 10, b.y + b.h / 2 - 14, 20, 14)

            this.add.text(b.x, b.y - 10, b.icon, {
              fontFamily: "serif", fontSize: "22px",
            }).setOrigin(0.5)
            this.add.text(b.x, b.y + 16, b.label, {
              fontFamily: "monospace", fontSize: "9px",
              color: `#${hex.toString(16).padStart(6, "0")}`,
              align: "center", letterSpacing: 1,
            }).setOrigin(0.5)

            this.zones.push({
              rect: new Phaser.Geom.Rectangle(b.x - b.w / 2 - 20, b.y - b.h / 2 - 20, b.w + 40, b.h + 40),
              id: b.id,
            })

            /* Click directo al edificio — alternativa a caminar + E */
            this.add.zone(b.x, b.y, b.w, b.h)
              .setInteractive({ useHandCursor: true })
              .on("pointerdown", () => callbackRef.current(b.id))
          })

          /* ── Jugador ── */
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

          /* ── Prompt de entrada ── */
          this.prompt = this.add.text(sx, sy - 30, "[ E ]  ENTRAR", {
            fontFamily: "monospace", fontSize: "10px",
            color: "#00d4ff",
            backgroundColor: "#0a0714cc",
            padding: { x: 7, y: 4 },
          }).setOrigin(0.5).setAlpha(0).setDepth(10)

          this.tweens.add({
            targets: this.prompt,
            alpha: { from: 0.4, to: 1 },
            duration: 550,
            yoyo: true,
            repeat: -1,
          })

          /* ── Cámara: centrada mostrando el mapa completo, no persigue al jugador ── */
          const fitCamera = () => {
            const zoom = Math.min(this.scale.width / MAP_W, this.scale.height / MAP_H) * 0.94
            this.cameras.main.setZoom(zoom)
            this.cameras.main.centerOn(cx, cy)
          }
          fitCamera()
          this.scale.on(Phaser.Scale.Events.RESIZE, fitCamera)
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

          this.playerGlow.setPosition(this.player.x, this.player.y)

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
        backgroundColor: "#0a0714",
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
