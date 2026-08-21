"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { getIdentidades } from "@/api/mapa-identidad/getIdentidades"
import { updateIdentidadPosicion } from "@/api/mapa-identidad/updateIdentidadPosicion"
import { MapaIdentidadType } from "@/types/mapa-identidad"

interface Props {
  onEnterZone: (module: string) => void
  /* true mientras el modal de una zona está abierto — pausa el juego por
     completo (no solo visualmente) para que no lleguen clics a los edificios
     de atrás. */
  paused?: boolean
}

export interface SegundoCerebroGameHandle {
  zoomIn:  () => void
  zoomOut: () => void
}

/* Mundo a 16:9 — llena pantallas anchas comunes sin dejar tanto margen vacío */
const MAP_W = 1600
const MAP_H = 900

const BOX_W = 150
const BOX_H = 95
const SECTOR_PADDING = 44
const MIN_ZOOM = 0.35
const MAX_ZOOM = 2.2
const CLICK_THRESHOLD = 6 // px de pantalla — menos que esto = clic, más = arrastre

type SceneBridge = {
  setPaused: (v: boolean) => void
  zoomBy:    (factor: number) => void
}

export const SegundoCerebroGame = forwardRef<SegundoCerebroGameHandle, Props>(
  function SegundoCerebroGame({ onEnterZone, paused = false }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const gameRef       = useRef<{ destroy: (r: boolean) => void } | null>(null)
    const callbackRef   = useRef(onEnterZone)
    callbackRef.current = onEnterZone
    const pausedRef = useRef(paused)
    pausedRef.current = paused
    const sceneRef  = useRef<SceneBridge | null>(null)
    const [dataLoading, setDataLoading] = useState(true)
    const [loadError,   setLoadError]   = useState("")

    useImperativeHandle(ref, () => ({
      zoomIn:  () => sceneRef.current?.zoomBy(1.25),
      zoomOut: () => sceneRef.current?.zoomBy(1 / 1.25),
    }))

    useEffect(() => {
      sceneRef.current?.setPaused(paused)
    }, [paused])

    useEffect(() => {
      if (!containerRef.current || gameRef.current) return

      let game: { destroy: (r: boolean) => void } | null = null
      let mounted = true

      ;(async () => {
        const [Phaser, identidades] = await Promise.all([
          import("phaser").then(m => m.default),
          getIdentidades().catch((err: any) => {
            setLoadError(err?.message ?? "Error al cargar el mapa")
            return [] as MapaIdentidadType[]
          }),
        ])
        if (!mounted || !containerRef.current) return
        setDataLoading(false)

        const activos = identidades.filter(i => i.activo !== false)

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
          prompt!:      Phaser.GameObjects.Text
          gamePaused = false

          sectorGfx!: Phaser.GameObjects.Graphics
          pathsGfx!:  Phaser.GameObjects.Graphics
          sectorLabels: Phaser.GameObjects.Text[] = []
          buildings: Array<{ container: Phaser.GameObjects.Container; data: MapaIdentidadType; icon: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text; hex: number }> = []

          isPanning = false
          dragMoved = false
          dragStartScreen = { x: 0, y: 0 }

          constructor() { super({ key: "SegundoCerebroScene" }) }

          create() {
            this.physics.world.setBounds(0, 0, MAP_W, MAP_H)
            this.cameras.main.setBounds(0, 0, MAP_W, MAP_H)

            const bgGfx = this.add.graphics()

            /* ── Fondo (violeta muy oscuro) ── */
            bgGfx.fillStyle(0x0a0714)
            bgGfx.fillRect(0, 0, MAP_W, MAP_H)

            /* ── Cuadrícula ── */
            bgGfx.lineStyle(1, 0x150f24, 0.6)
            for (let x = 0; x <= MAP_W; x += 48) bgGfx.lineBetween(x, 0, x, MAP_H)
            for (let y = 0; y <= MAP_H; y += 48) bgGfx.lineBetween(0, y, MAP_W, y)

            /* ── Caminos principales ── */
            bgGfx.lineStyle(24, 0x120c1f, 1)
            bgGfx.lineBetween(0, MAP_H / 2, MAP_W, MAP_H / 2)
            bgGfx.lineBetween(MAP_W / 2, 0, MAP_W / 2, MAP_H)
            bgGfx.lineStyle(1, 0x1a1330, 0.8)
            bgGfx.lineBetween(0, MAP_H / 2, MAP_W, MAP_H / 2)
            bgGfx.lineBetween(MAP_W / 2, 0, MAP_W / 2, MAP_H)

            /* ── Plaza central ── */
            const cx = MAP_W / 2, cy = MAP_H / 2
            bgGfx.fillStyle(0x0d0818)
            bgGfx.fillCircle(cx, cy, 90)
            bgGfx.lineStyle(1, 0x241a3d, 1)
            bgGfx.strokeCircle(cx, cy, 90)
            bgGfx.lineStyle(1, 0x1a1330, 1)
            bgGfx.strokeCircle(cx, cy, 75)
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

            /* ── Capas dinámicas (se redibujan cuando alguien mueve una caja) ── */
            this.sectorGfx = this.add.graphics()
            this.pathsGfx  = this.add.graphics()
            this.pathsGfx.setDepth(-1)

            /* ── Edificios (uno por identidad, cada uno arrastrable) ── */
            activos.forEach(item => this.buildings.push(this.makeBuilding(item)))
            this.redrawDynamic()

            /* ── Jugador ── */
            const sx = cx, sy = cy + 110
            this.playerGlow = this.add.rectangle(sx, sy, 22, 26, 0x00d4ff, 0.08)
            this.player = this.add.rectangle(sx, sy, 10, 14, 0x00d4ff)
            this.physics.add.existing(this.player)
            ;(this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true)

            /* ── Input de teclado ── */
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

            /* ── Cámara: arranca mostrando el mapa completo, pero ya libre
               (arrastrar para mover, rueda para zoom) ── */
            const zoomInicial = Math.min(this.scale.width / MAP_W, this.scale.height / MAP_H) * 0.97
            this.cameras.main.setZoom(Phaser.Math.Clamp(zoomInicial, MIN_ZOOM, MAX_ZOOM))
            this.cameras.main.centerOn(cx, cy)

            this.setupCameraControls()
            this.setupDragControls()

            sceneRef.current = { setPaused: v => this.setPaused(v), zoomBy: f => this.zoomBy(f) }
            this.setPaused(pausedRef.current)
          }

          /* Construye una caja/edificio arrastrable a partir de una identidad */
          makeBuilding(item: MapaIdentidadType) {
            const hex = Number.parseInt((item.color || "a78bfa").replace("#", ""), 16) || 0xa78bfa
            const left = -BOX_W / 2, top = -BOX_H / 2

            const container = this.add.container(item.x, item.y)
            const gfx = this.add.graphics()

            if (item.placeholder) {
              gfx.lineStyle(1, hex, 0.25)
              gfx.strokeRoundedRect(left, top, BOX_W, BOX_H, 8)
              container.add(gfx)
              const iconT = this.add.text(0, -6, item.icono, { fontFamily: "serif", fontSize: "16px" })
                .setOrigin(0.5).setAlpha(0.35)
              const labelT = this.add.text(0, 16, item.nombre, {
                fontFamily: "monospace", fontSize: "8px",
                color: `#${hex.toString(16).padStart(6, "0")}`,
                align: "center", letterSpacing: 1,
              }).setOrigin(0.5).setAlpha(0.45)
              container.add([iconT, labelT])
              container.setSize(BOX_W + 40, BOX_H + 40)
              container.setInteractive({ useHandCursor: true, draggable: true })
              return { container, data: item, icon: iconT, label: labelT, hex }
            }

            /* Sombra */
            gfx.fillStyle(0x000000, 0.6)
            gfx.fillRoundedRect(left + 5, top + 5, BOX_W, BOX_H, 8)

            /* Halo suave */
            gfx.lineStyle(6, hex, 0.05)
            gfx.strokeRoundedRect(left - 5, top - 5, BOX_W + 10, BOX_H + 10, 12)
            gfx.lineStyle(3, hex, 0.09)
            gfx.strokeRoundedRect(left - 2, top - 2, BOX_W + 4, BOX_H + 4, 10)

            /* Relleno base */
            const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255
            const darkHex = ((Math.floor(r * 0.07) << 16) | (Math.floor(g * 0.07) << 8) | Math.floor(b * 0.10))
            gfx.fillStyle(darkHex)
            gfx.fillRoundedRect(left, top, BOX_W, BOX_H, 8)

            /* Falso degradado */
            gfx.fillStyle(hex, 0.05)
            gfx.fillRoundedRect(left, top, BOX_W, BOX_H / 2, { tl: 8, tr: 8, bl: 0, br: 0 })

            /* Borde + acento superior */
            gfx.lineStyle(1.5, hex, 0.65)
            gfx.strokeRoundedRect(left, top, BOX_W, BOX_H, 8)
            gfx.lineStyle(2, hex, 0.55)
            gfx.lineBetween(left + 10, top, left + BOX_W - 10, top)

            /* Insignia del ícono */
            gfx.fillStyle(hex, 0.14)
            gfx.fillCircle(0, -12, 17)
            gfx.lineStyle(1, hex, 0.35)
            gfx.strokeCircle(0, -12, 17)

            /* Franja inferior */
            gfx.fillStyle(hex, 0.16)
            gfx.fillRoundedRect(left + 6, top + BOX_H - 15, BOX_W - 12, 9, 3)

            container.add(gfx)

            const iconT = this.add.text(0, -12, item.icono, { fontFamily: "serif", fontSize: "20px" }).setOrigin(0.5)
            const labelT = this.add.text(0, 16, item.nombre, {
              fontFamily: "monospace", fontSize: "9px",
              color: `#${hex.toString(16).padStart(6, "0")}`,
              align: "center", letterSpacing: 1,
            }).setOrigin(0.5)
            container.add([iconT, labelT])

            container.setSize(BOX_W + 40, BOX_H + 40)
            container.setInteractive({ useHandCursor: true, draggable: true })

            return { container, data: item, icon: iconT, label: labelT, hex }
          }

          /* Recalcula y redibuja los contenedores de sector + los caminos a la
             plaza, a partir de las posiciones ACTUALES de cada caja — se llama
             al cargar y cada vez que alguien suelta un arrastre. */
          redrawDynamic() {
            this.sectorGfx.clear()
            this.pathsGfx.clear()
            this.sectorLabels.forEach(t => t.destroy())
            this.sectorLabels = []

            const cx = MAP_W / 2, cy = MAP_H / 2
            this.pathsGfx.lineStyle(10, 0x0f0a1a, 1)
            this.buildings.forEach(b => {
              this.pathsGfx.lineBetween(b.container.x, b.container.y, cx, cy)
            })

            const bySector = new Map<string, typeof this.buildings>()
            this.buildings.forEach(b => {
              const key = b.data.sector || "otros"
              if (!bySector.has(key)) bySector.set(key, [])
              bySector.get(key)!.push(b)
            })

            bySector.forEach((boxes, sector) => {
              const left   = Math.min(...boxes.map(b => b.container.x - BOX_W / 2)) - SECTOR_PADDING
              const right  = Math.max(...boxes.map(b => b.container.x + BOX_W / 2)) + SECTOR_PADDING
              const top    = Math.min(...boxes.map(b => b.container.y - BOX_H / 2)) - SECTOR_PADDING
              const bottom = Math.max(...boxes.map(b => b.container.y + BOX_H / 2)) + SECTOR_PADDING
              const hex = boxes[0].hex

              this.sectorGfx.fillStyle(hex, 0.035)
              this.sectorGfx.fillRoundedRect(left, top, right - left, bottom - top, 20)
              this.sectorGfx.lineStyle(1, hex, 0.22)
              this.sectorGfx.strokeRoundedRect(left, top, right - left, bottom - top, 20)

              const label = this.add.text((left + right) / 2, top + 18, sector.toUpperCase(), {
                fontFamily: "monospace", fontSize: "10px",
                color: `#${hex.toString(16).padStart(6, "0")}`,
                align: "center", letterSpacing: 3,
              }).setOrigin(0.5).setAlpha(0.55).setDepth(-1)
              this.sectorLabels.push(label)
            })
          }

          /* Cámara libre: arrastrar sobre espacio vacío mueve la cámara; la
             rueda del mouse hace zoom centrado en el cursor. */
          setupCameraControls() {
            this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
              if (currentlyOver.length === 0) this.isPanning = true
            })
            this.input.on("pointerup", () => { this.isPanning = false })
            this.input.on("pointerupoutside", () => { this.isPanning = false })
            this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
              if (!this.isPanning || !pointer.isDown) return
              const cam = this.cameras.main
              cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom
              cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom
            })
            this.input.on("wheel", (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, deltaY: number) => {
              this.zoomBy(deltaY > 0 ? 0.9 : 1.1)
            })
          }

          zoomBy(factor: number) {
            const cam = this.cameras.main
            cam.zoom = Phaser.Math.Clamp(cam.zoom * factor, MIN_ZOOM, MAX_ZOOM)
          }

          /* Arrastrar una caja la mueve; si el movimiento fue mínimo, cuenta
             como clic normal (entrar a la zona) en vez de arrastre. */
          setupDragControls() {
            this.input.on("dragstart", (pointer: Phaser.Input.Pointer) => {
              this.dragMoved = false
              this.dragStartScreen = { x: pointer.x, y: pointer.y }
            })

            this.input.on("drag", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
              const container = gameObject as Phaser.GameObjects.Container
              container.x = dragX
              container.y = dragY
              const moved = Math.hypot(pointer.x - this.dragStartScreen.x, pointer.y - this.dragStartScreen.y)
              if (moved > CLICK_THRESHOLD) this.dragMoved = true
            })

            this.input.on("dragend", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
              const container = gameObject as Phaser.GameObjects.Container
              const entry = this.buildings.find(b => b.container === container)
              if (!entry) return

              if (this.dragMoved) {
                this.redrawDynamic()
                updateIdentidadPosicion(entry.data.documentId, container.x, container.y).catch(err => {
                  console.error("No se pudo guardar la posición:", err)
                })
              } else if (!entry.data.placeholder && entry.data.moduleId) {
                this.popBuilding(entry)
                callbackRef.current(entry.data.moduleId)
              }
            })
          }

          setPaused(v: boolean) {
            this.gamePaused = v
            this.input.enabled = !v
            if (v) {
              ;(this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0)
              this.prompt.setAlpha(0)
            }
          }

          popBuilding(entry: { icon: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text; container: Phaser.GameObjects.Container; hex: number }) {
            this.tweens.add({
              targets: [entry.icon, entry.label],
              scale: { from: 1, to: 1.3 },
              duration: 110,
              yoyo: true,
              ease: "Back.easeOut",
            })

            const ring = this.add.graphics({ x: entry.container.x, y: entry.container.y })
            ring.lineStyle(2.5, entry.hex, 0.85)
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

            let found: typeof this.buildings[number] | null = null
            for (const b of this.buildings) {
              if (b.data.placeholder || !b.data.moduleId) continue
              const dx = Math.abs(this.player.x - b.container.x)
              const dy = Math.abs(this.player.y - b.container.y)
              if (dx < BOX_W / 2 + 20 && dy < BOX_H / 2 + 20) { found = b; break }
            }

            if (found) {
              this.prompt.setPosition(found.container.x, found.container.y - BOX_H / 2 - 18).setAlpha(this.prompt.alpha || 0.7)
              if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.popBuilding(found)
                callbackRef.current(found.data.moduleId!)
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

    return (
      <>
        <div ref={containerRef} className="absolute inset-0" />
        {(dataLoading || loadError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0714]">
            <p className="text-[10px] font-mono text-violet-500/40 uppercase tracking-[0.2em] animate-pulse">
              {loadError ? "No se pudo cargar el mapa" : "Cargando identidades..."}
            </p>
            {loadError && <p className="text-[9px] font-mono text-slate-700 mt-2">{loadError}</p>}
          </div>
        )}
      </>
    )
  }
)
