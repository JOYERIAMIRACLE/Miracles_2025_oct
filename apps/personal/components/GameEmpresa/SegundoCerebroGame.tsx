"use client"

import { useEffect, useRef } from "react"

interface Props {
  onEnterZone: (module: string) => void
  /* true mientras el modal de una zona está abierto — pausa el juego por
     completo (no solo visualmente) para que no lleguen clics a los edificios
     de atrás. */
  paused?: boolean
}

/* Mundo a 16:9 — llena pantallas anchas comunes sin dejar tanto margen vacío */
const MAP_W = 1600
const MAP_H = 900

/* Ritmo de cuadrícula compartido por los 3 sectores — misma separación de filas
   en todos lados, para que se sientan parte de un mismo sistema, no islas sueltas. */
const BOX_W = 150
const BOX_H = 95
const ROW_PITCH = 150
const SECTOR_PADDING = 44

type Building = {
  x: number; y: number
  icon: string; label: string; id: string
  sector: "richiavrod" | "medallitadeoro" | "sdi"
  r: number; g: number; b: number
  placeholder?: boolean
}

const ROWS_3 = [220, 370, 520] as const

const BUILDINGS: Building[] = [
  // RICHIAVROD — columna izquierda, 1x3
  { x: 220, y: ROWS_3[0], icon: "🏢", label: "OFICINA RICHI", id: "oficina-richiavrod", sector: "richiavrod", r: 167, g: 139, b: 250 },
  { x: 220, y: ROWS_3[1], icon: "🏬", label: "ALMACÉN RICHI", id: "almacen-richiavrod", sector: "richiavrod", r: 124, g: 58,  b: 198 },
  { x: 220, y: ROWS_3[2], icon: "🧩", label: "TALLER RICHI",  id: "taller-richiavrod",  sector: "richiavrod", r: 217, g: 70,  b: 239 },

  // MEDALLITADEORO — centro, 2x3 (6 celdas, la última es un espacio reservado)
  { x: 640, y: ROWS_3[0], icon: "🏢", label: "OFICINA MEDALLA",     id: "oficina-medallitadeoro",     sector: "medallitadeoro", r: 192, g: 132, b: 252 },
  { x: 960, y: ROWS_3[0], icon: "🏬", label: "ALMACÉN MEDALLA",     id: "almacen-medallitadeoro",     sector: "medallitadeoro", r: 147, g: 51,  b: 234 },
  { x: 640, y: ROWS_3[1], icon: "🪟", label: "APARADOR",            id: "aparador-medallitadeoro",    sector: "medallitadeoro", r: 216, g: 180, b: 254 },
  { x: 960, y: ROWS_3[1], icon: "🧩", label: "TALLER MEDALLA",      id: "taller-medallitadeoro",      sector: "medallitadeoro", r: 217, g: 70,  b: 239 },
  { x: 640, y: ROWS_3[2], icon: "🕸️", label: "ARQUITECTURA",        id: "arquitectura-medallitadeoro", sector: "medallitadeoro", r: 233, g: 213, b: 255 },
  { x: 960, y: ROWS_3[2], icon: "✨", label: "PRÓXIMAMENTE",        id: "proximamente-medallitadeoro", sector: "medallitadeoro", r: 90,  g: 80,  b: 120, placeholder: true },

  // SDI PORTAL — columna derecha, 1x3
  { x: 1380, y: ROWS_3[0], icon: "🏢", label: "OFICINA SDI", id: "oficina-sdi", sector: "sdi", r: 129, g: 140, b: 248 },
  { x: 1380, y: ROWS_3[1], icon: "🏬", label: "ALMACÉN SDI", id: "almacen-sdi", sector: "sdi", r: 99,  g: 102, b: 241 },
  { x: 1380, y: ROWS_3[2], icon: "🧩", label: "TALLER SDI",  id: "taller-sdi",  sector: "sdi", r: 217, g: 70,  b: 239 },
]

const SECTOR_META: Record<Building["sector"], { label: string; r: number; g: number; b: number }> = {
  richiavrod:     { label: "RICHIAVROD",     r: 167, g: 139, b: 250 },
  medallitadeoro: { label: "MEDALLITADEORO", r: 192, g: 132, b: 252 },
  sdi:            { label: "SDI PORTAL",     r: 129, g: 140, b: 248 },
}

/* Los contenedores de sector se calculan a partir de las cajas que agrupan —
   así nunca quedan paddings inconsistentes entre lados, como pasaba antes. */
function computeSectors() {
  const bySector = new Map<Building["sector"], Building[]>()
  for (const b of BUILDINGS) {
    if (!bySector.has(b.sector)) bySector.set(b.sector, [])
    bySector.get(b.sector)!.push(b)
  }
  return Array.from(bySector.entries()).map(([sector, boxes]) => {
    const left   = Math.min(...boxes.map(b => b.x - BOX_W / 2)) - SECTOR_PADDING
    const right  = Math.max(...boxes.map(b => b.x + BOX_W / 2)) + SECTOR_PADDING
    const top    = Math.min(...boxes.map(b => b.y - BOX_H / 2)) - SECTOR_PADDING
    const bottom = Math.max(...boxes.map(b => b.y + BOX_H / 2)) + SECTOR_PADDING
    const meta = SECTOR_META[sector]
    return { x: left, y: top, w: right - left, h: bottom - top, ...meta }
  })
}

const SECTORS = computeSectors()

export function SegundoCerebroGame({ onEnterZone, paused = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef      = useRef<{ destroy: (r: boolean) => void } | null>(null)
  const callbackRef  = useRef(onEnterZone)
  callbackRef.current = onEnterZone
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const sceneRef = useRef<{ setPaused: (v: boolean) => void } | null>(null)

  useEffect(() => {
    sceneRef.current?.setPaused(paused)
  }, [paused])

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
        buildingVisuals = new Map<string, { icon: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text; x: number; y: number; hex: number }>()
        gamePaused = false

        constructor() { super({ key: "SegundoCerebroScene" }) }

        create() {
          this.physics.world.setBounds(0, 0, MAP_W, MAP_H)
          this.cameras.main.setBounds(0, 0, MAP_W, MAP_H)

          const gfx = this.add.graphics()

          /* ── Fondo (violeta muy oscuro) ── */
          gfx.fillStyle(0x0a0714)
          gfx.fillRect(0, 0, MAP_W, MAP_H)

          /* ── Cuadrícula ── */
          gfx.lineStyle(1, 0x150f24, 0.6)
          for (let x = 0; x <= MAP_W; x += 48) gfx.lineBetween(x, 0, x, MAP_H)
          for (let y = 0; y <= MAP_H; y += 48) gfx.lineBetween(0, y, MAP_W, y)

          /* ── Caminos principales ── */
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
          for (let i = 0; i < 80; i++) {
            const dx = Math.random() * MAP_W
            const dy = Math.random() * MAP_H
            const alpha = Math.random() * 0.3 + 0.05
            dotGfx.fillStyle(0x3d2a63, alpha)
            dotGfx.fillCircle(dx, dy, 1)
          }

          /* ── Sectores (contenedores calculados a partir de sus cajas) ── */
          SECTORS.forEach(s => {
            const hex = (s.r << 16) | (s.g << 8) | s.b
            gfx.fillStyle(hex, 0.035)
            gfx.fillRoundedRect(s.x, s.y, s.w, s.h, 20)
            gfx.lineStyle(1, hex, 0.22)
            gfx.strokeRoundedRect(s.x, s.y, s.w, s.h, 20)

            this.add.text(s.x + s.w / 2, s.y + 18, s.label, {
              fontFamily: "monospace", fontSize: "10px",
              color: `#${hex.toString(16).padStart(6, "0")}`,
              align: "center", letterSpacing: 3,
            }).setOrigin(0.5).setAlpha(0.55)
          })

          /* ── Edificios ── */
          BUILDINGS.forEach(b => {
            const hex = (b.r << 16) | (b.g << 8) | b.b
            const left = b.x - BOX_W / 2, top = b.y - BOX_H / 2

            if (b.placeholder) {
              /* Celda reservada — solo contorno tenue, sin relleno ni zona clickeable */
              gfx.lineStyle(1, hex, 0.25)
              gfx.strokeRoundedRect(left, top, BOX_W, BOX_H, 8)
              this.add.text(b.x, b.y - 6, b.icon, { fontFamily: "serif", fontSize: "16px" })
                .setOrigin(0.5).setAlpha(0.35)
              this.add.text(b.x, b.y + 16, b.label, {
                fontFamily: "monospace", fontSize: "8px",
                color: `#${hex.toString(16).padStart(6, "0")}`,
                align: "center", letterSpacing: 1,
              }).setOrigin(0.5).setAlpha(0.45)
              return
            }

            /* Sombra */
            gfx.fillStyle(0x000000, 0.6)
            gfx.fillRoundedRect(left + 5, top + 5, BOX_W, BOX_H, 8)

            /* Halo suave (glow simulado con trazos concéntricos, compatible con
               cualquier renderer, sin depender de postFX/shaders) */
            gfx.lineStyle(6, hex, 0.05)
            gfx.strokeRoundedRect(left - 5, top - 5, BOX_W + 10, BOX_H + 10, 12)
            gfx.lineStyle(3, hex, 0.09)
            gfx.strokeRoundedRect(left - 2, top - 2, BOX_W + 4, BOX_H + 4, 10)

            /* Relleno base, muy oscuro y teñido del color del edificio */
            const darkR = Math.floor(b.r * 0.07)
            const darkG = Math.floor(b.g * 0.07)
            const darkB = Math.floor(b.b * 0.10)
            const darkHex = (darkR << 16) | (darkG << 8) | darkB
            gfx.fillStyle(darkHex)
            gfx.fillRoundedRect(left, top, BOX_W, BOX_H, 8)

            /* Falso degradado: overlay más claro en la mitad superior (luz desde arriba) */
            gfx.fillStyle(hex, 0.05)
            gfx.fillRoundedRect(left, top, BOX_W, BOX_H / 2, { tl: 8, tr: 8, bl: 0, br: 0 })

            /* Borde */
            gfx.lineStyle(1.5, hex, 0.65)
            gfx.strokeRoundedRect(left, top, BOX_W, BOX_H, 8)

            /* Línea superior de acento */
            gfx.lineStyle(2, hex, 0.55)
            gfx.lineBetween(left + 10, top, left + BOX_W - 10, top)

            /* Insignia del ícono — círculo de fondo para que se sienta "diseñado" */
            gfx.fillStyle(hex, 0.14)
            gfx.fillCircle(b.x, b.y - 12, 17)
            gfx.lineStyle(1, hex, 0.35)
            gfx.strokeCircle(b.x, b.y - 12, 17)

            const iconText = this.add.text(b.x, b.y - 12, b.icon, {
              fontFamily: "serif", fontSize: "20px",
            }).setOrigin(0.5)

            /* Franja inferior — barra de acento a todo lo ancho, en vez del
               bloque suelto en la esquina que traía antes */
            gfx.fillStyle(hex, 0.16)
            gfx.fillRoundedRect(left + 6, top + BOX_H - 15, BOX_W - 12, 9, 3)

            const labelText = this.add.text(b.x, b.y + 16, b.label, {
              fontFamily: "monospace", fontSize: "9px",
              color: `#${hex.toString(16).padStart(6, "0")}`,
              align: "center", letterSpacing: 1,
            }).setOrigin(0.5)

            this.buildingVisuals.set(b.id, { icon: iconText, label: labelText, x: b.x, y: b.y, hex })

            this.zones.push({
              rect: new Phaser.Geom.Rectangle(left - 20, top - 20, BOX_W + 40, BOX_H + 40),
              id: b.id,
            })

            /* Click directo al edificio — alternativa a caminar + E */
            this.add.zone(b.x, b.y, BOX_W, BOX_H)
              .setInteractive({ useHandCursor: true })
              .on("pointerdown", () => {
                this.popBuilding(b.id)
                callbackRef.current(b.id)
              })
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
            const zoom = Math.min(this.scale.width / MAP_W, this.scale.height / MAP_H) * 0.97
            this.cameras.main.setZoom(zoom)
            this.cameras.main.centerOn(cx, cy)
          }
          fitCamera()
          this.scale.on(Phaser.Scale.Events.RESIZE, fitCamera)

          sceneRef.current = this
          this.setPaused(pausedRef.current)
        }

        /* Pausa real del juego (no solo visual) mientras el modal de una zona
           está abierto — sin esto, Phaser sigue procesando clics sobre los
           edificios aunque el modal los tape en pantalla. */
        setPaused(v: boolean) {
          this.gamePaused = v
          this.input.enabled = !v
          if (v) {
            ;(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0)
            this.prompt.setAlpha(0)
          }
        }

        /* Animación al entrar a un edificio: el ícono/label "rebotan" y un
           anillo se expande desde el centro y se desvanece — feedback táctil
           tanto para clic directo como para caminar + E. */
        popBuilding(id: string) {
          const v = this.buildingVisuals.get(id)
          if (!v) return

          this.tweens.add({
            targets: [v.icon, v.label],
            scale: { from: 1, to: 1.3 },
            duration: 110,
            yoyo: true,
            ease: "Back.easeOut",
          })

          const ring = this.add.graphics({ x: v.x, y: v.y })
          ring.lineStyle(2.5, v.hex, 0.85)
          ring.strokeCircle(0, 0, 12)
          ring.setDepth(20)
          this.tweens.add({
            targets: ring,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 420,
            ease: "Cubic.easeOut",
            onComplete: () => ring.destroy(),
          })
        }

        update() {
          if (this.gamePaused) return

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
              this.popBuilding(found)
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
