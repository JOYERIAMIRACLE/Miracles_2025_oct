"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { getIdentidades } from "@/api/mapa-identidad/getIdentidades"
import { updateIdentidadPosicion } from "@/api/mapa-identidad/updateIdentidadPosicion"
import { updateIdentidadActivo } from "@/api/mapa-identidad/updateIdentidadActivo"
import { MapaIdentidadType } from "@/types/mapa-identidad"

interface Props {
  onEnterZone: (module: string) => void
  /* true mientras el modal de una zona está abierto — pausa el juego por
     completo (no solo visualmente) para que no lleguen clics a los edificios
     de atrás. */
  paused?: boolean
}

export interface SegundoCerebroGameHandle {
  zoomIn:      () => void
  zoomOut:     () => void
  addIdentidad: (item: MapaIdentidadType) => void
}

/* Mundo a 16:9 — llena pantallas anchas comunes sin dejar tanto margen vacío.
   El centro (plaza, jugador, cruce de caminos) sigue siendo MAP_W/2, MAP_H/2
   — no se toca, para no descuadrar los edificios ya guardados con sus
   posiciones reales. PAD_X/PAD_Y agregan vacío explorable alrededor de ese
   mismo centro (simétrico, así el centro no se mueve) para poder navegar en
   modo aéreo con espacio real de paneo, no solo zoom. */
const MAP_W = 1600
const MAP_H = 900
const PAD_X = 1200
const PAD_Y = 675

const BOX_W = 150
const BOX_H = 95
const SECTOR_PADDING = 44
const MIN_ZOOM = 0.35
const MAX_ZOOM = 2.2
const CLICK_THRESHOLD = 6 // px de pantalla — menos que esto = clic, más = arrastre

type SceneBridge = {
  setPaused:    (v: boolean) => void
  zoomBy:       (factor: number) => void
  zoomByEased:  (factor: number) => void
  addBuilding:  (item: MapaIdentidadType) => void
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
      zoomIn:       () => sceneRef.current?.zoomByEased(1.25),
      zoomOut:      () => sceneRef.current?.zoomByEased(1 / 1.25),
      addIdentidad: item => sceneRef.current?.addBuilding(item),
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

        type BuildingEntry = {
          container: Phaser.GameObjects.Container
          data:      MapaIdentidadType
          icon:      Phaser.GameObjects.Text
          label:     Phaser.GameObjects.Text
          hex:       number
        }

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

          pathsGfx!:  Phaser.GameObjects.Graphics
          staticLamps:  Phaser.GameObjects.Container[] = []
          dynamicLamps: Phaser.GameObjects.Container[] = []
          buildings: BuildingEntry[] = []
          sectorContainers = new Map<Phaser.GameObjects.Container, { sector: string; members: BuildingEntry[] }>()

          /* Vida de videojuego: bamboleo del jugador al caminar, "respiración"
             del edificio más cercano cuando se puede entrar, y zoom con
             inercia — todo apagable con prefers-reduced-motion. */
          reducedMotion = false
          walkT = 0
          nearBuilding: BuildingEntry | null = null
          nearTween: Phaser.Tweens.Tween | null = null
          activeDragTarget: Phaser.GameObjects.Container | null = null

          isPanning = false
          dragMoved = false
          dragStartScreen = { x: 0, y: 0 }
          pinchDistance = 0

          constructor() { super({ key: "SegundoCerebroScene" }) }

          create() {
            this.reducedMotion = typeof window !== "undefined"
              && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true

            const worldLeft = -PAD_X, worldTop = -PAD_Y
            const worldW = MAP_W + PAD_X * 2, worldH = MAP_H + PAD_Y * 2
            this.physics.world.setBounds(worldLeft, worldTop, worldW, worldH)
            this.cameras.main.setBounds(worldLeft, worldTop, worldW, worldH)

            const bgGfx = this.add.graphics()

            /* ── Fondo (violeta muy oscuro) — cubre todo el espacio explorable,
               no solo el núcleo original ── */
            bgGfx.fillStyle(0x0a0714)
            bgGfx.fillRect(worldLeft, worldTop, worldW, worldH)

            /* ── Cuadrícula ── */
            bgGfx.lineStyle(1, 0x150f24, 0.6)
            for (let x = worldLeft; x <= worldLeft + worldW; x += 48) bgGfx.lineBetween(x, worldTop, x, worldTop + worldH)
            for (let y = worldTop; y <= worldTop + worldH; y += 48) bgGfx.lineBetween(worldLeft, y, worldLeft + worldW, y)

            /* ── Caminos principales — se extienden hasta el borde explorable ── */
            bgGfx.lineStyle(24, 0x120c1f, 1)
            bgGfx.lineBetween(worldLeft, MAP_H / 2, worldLeft + worldW, MAP_H / 2)
            bgGfx.lineBetween(MAP_W / 2, worldTop, MAP_W / 2, worldTop + worldH)
            bgGfx.lineStyle(1, 0x1a1330, 0.8)
            bgGfx.lineBetween(worldLeft, MAP_H / 2, worldLeft + worldW, MAP_H / 2)
            bgGfx.lineBetween(MAP_W / 2, worldTop, MAP_W / 2, worldTop + worldH)

            /* ── Farolas de las avenidas principales — no se vuelven a
               calcular nunca, las avenidas no se mueven ── */
            this.staticLamps.push(
              ...this.placeLampsAlong(worldLeft, MAP_H / 2, MAP_W / 2 - 110, MAP_H / 2, 190, 40),
              ...this.placeLampsAlong(MAP_W / 2 + 110, MAP_H / 2, worldLeft + worldW, MAP_H / 2, 190, 40),
              ...this.placeLampsAlong(MAP_W / 2, worldTop, MAP_W / 2, MAP_H / 2 - 110, 190, 40),
              ...this.placeLampsAlong(MAP_W / 2, MAP_H / 2 + 110, MAP_W / 2, worldTop + worldH, 190, 40),
            )

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

            /* ── Puntos ambientales — misma densidad que antes, ahora sobre
               toda el área explorable (~6x más grande que el núcleo) ── */
            const dotGfx = this.add.graphics()
            for (let i = 0; i < 480; i++) {
              const dx = worldLeft + Math.random() * worldW
              const dy = worldTop + Math.random() * worldH
              const alpha = Math.random() * 0.3 + 0.05
              dotGfx.fillStyle(0x3d2a63, alpha)
              dotGfx.fillCircle(dx, dy, 1)
            }

            /* ── Capa dinámica de caminos (se redibuja cuando alguien mueve algo) ── */
            this.pathsGfx = this.add.graphics()
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

            sceneRef.current = {
              setPaused:   v => this.setPaused(v),
              zoomBy:      f => this.zoomBy(f),
              zoomByEased: f => this.zoomByEased(f),
              addBuilding: item => this.addBuildingLive(item),
            }
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
              container.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
                if (!pointer.rightButtonDown()) return
                const entry = this.buildings.find(b => b.data === item)
                if (entry) this.requestRemoveBuilding(entry)
              })
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
            container.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
              if (!pointer.rightButtonDown()) return
              const entry = this.buildings.find(b => b.data === item)
              if (entry) this.requestRemoveBuilding(entry)
            })

            return { container, data: item, icon: iconT, label: labelT, hex }
          }

          /* Click derecho en un edificio (real o placeholder) lo quita del
             mapa. Soft-delete (activo=false, nunca un DELETE real) — mismo
             criterio de "nunca perder información" que el resto de la app;
             sigue existiendo en Strapi por si algún día se quiere de vuelta. */
          requestRemoveBuilding(entry: BuildingEntry) {
            if (!window.confirm(`¿Quitar "${entry.data.nombre}" del mapa?`)) return
            if (this.nearBuilding === entry) {
              this.nearTween?.stop()
              this.nearBuilding = null
            }
            this.buildings = this.buildings.filter(b => b !== entry)
            updateIdentidadActivo(entry.data.documentId, false).catch(err => {
              console.error("No se pudo quitar del mapa:", err)
            })
            if (this.reducedMotion) {
              entry.container.destroy()
              this.redrawDynamic()
              return
            }
            this.tweens.add({
              targets: entry.container,
              scale: 0, alpha: 0,
              duration: 260,
              ease: "Cubic.easeIn",
              onComplete: () => { entry.container.destroy(); this.redrawDynamic() },
            })
          }

          /* Farola: poste + charco de luz cálido en el piso + foco arriba.
             Cálido a propósito — es luz de calle, no de ningún edificio, así
             que no compite con "cada edificio es dueño de su color" ni con
             el cian exclusivo del jugador. Respira suave si hay movimiento. */
          makeLamp(x: number, y: number): Phaser.GameObjects.Container {
            const c = this.add.container(x, y)
            /* Sin profundidad negativa a propósito: bgGfx (el fondo, cuadrícula
               y avenidas) es opaco y se dibuja primero — cualquier cosa con
               profundidad < 0 queda tapada debajo de ese relleno sólido. Con
               profundidad por default (0) y creada DESPUÉS de bgGfx, la
               farola pinta encima del fondo por orden de inserción, que es
               lo que se necesita para que se vea. */
            const gfx = this.add.graphics()
            gfx.fillStyle(0x1a1330, 1)
            gfx.fillRect(-1.5, -14, 3, 14)
            gfx.fillStyle(0xffb877, 0.045)
            gfx.fillCircle(0, 1, 34)
            gfx.fillStyle(0xffb877, 0.08)
            gfx.fillCircle(0, 1, 18)
            gfx.fillStyle(0xffb877, 0.25)
            gfx.fillCircle(0, -14, 7)
            gfx.fillStyle(0xffb877, 0.9)
            gfx.fillCircle(0, -14, 2.5)
            c.add(gfx)
            if (!this.reducedMotion) {
              this.tweens.add({
                targets: gfx, alpha: { from: 0.7, to: 1 },
                duration: 1300 + Math.random() * 900, delay: Math.random() * 800,
                yoyo: true, repeat: -1, ease: "Sine.easeInOut",
              })
            }
            return c
          }

          /* Reparte farolas a lo largo de un tramo recto, dejando margen en
             ambas puntas (para no encimarlas con la plaza o un edificio). */
          placeLampsAlong(x1: number, y1: number, x2: number, y2: number, step: number, margin: number): Phaser.GameObjects.Container[] {
            const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2)
            const usable = dist - margin * 2
            if (usable < step * 0.5) return []
            const count = Math.max(1, Math.round(usable / step))
            const lamps: Phaser.GameObjects.Container[] = []
            for (let i = 1; i <= count; i++) {
              const t = (margin + (usable * i) / (count + 1)) / dist
              lamps.push(this.makeLamp(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t))
            }
            return lamps
          }

          /* Recalcula los contenedores de sector (arrastrables como grupo) + los
             caminos a la plaza, a partir de las posiciones ACTUALES de cada
             caja — se llama al cargar, al soltar un arrastre, y al agregar una
             caja nueva. No se llama mientras un arrastre está en curso (eso
             destruiría el objeto que Phaser está arrastrando). */
          redrawDynamic() {
            this.pathsGfx.clear()
            this.sectorContainers.forEach((_info, container) => container.destroy())
            this.sectorContainers.clear()
            this.dynamicLamps.forEach(l => l.destroy())
            this.dynamicLamps = []

            const cx = MAP_W / 2, cy = MAP_H / 2
            this.pathsGfx.lineStyle(10, 0x0f0a1a, 1)
            this.buildings.forEach(b => {
              this.pathsGfx.lineBetween(b.container.x, b.container.y, cx, cy)
              this.dynamicLamps.push(...this.placeLampsAlong(b.container.x, b.container.y, cx, cy, 130, 80))
            })

            const bySector = new Map<string, BuildingEntry[]>()
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
              const w = right - left, h = bottom - top
              const hex = boxes[0].hex

              const sectorContainer = this.add.container(left, top)
              sectorContainer.setDepth(-1) // detrás de los edificios, que se agregaron después

              const gfx = this.add.graphics()
              gfx.fillStyle(hex, 0.035)
              gfx.fillRoundedRect(0, 0, w, h, 20)
              gfx.lineStyle(1, hex, 0.22)
              gfx.strokeRoundedRect(0, 0, w, h, 20)
              sectorContainer.add(gfx)

              const label = this.add.text(w / 2, 18, sector.toUpperCase(), {
                fontFamily: "monospace", fontSize: "10px",
                color: `#${hex.toString(16).padStart(6, "0")}`,
                align: "center", letterSpacing: 3,
              }).setOrigin(0.5).setAlpha(0.55)
              sectorContainer.add(label)

              /* Área arrastrable = todo el rectángulo del sector, en coordenadas
                 locales (0,0)-(w,h) porque el contenedor no está centrado. */
              sectorContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains)
              this.input.setDraggable(sectorContainer)

              this.sectorContainers.set(sectorContainer, { sector, members: boxes })
            })
          }

          /* Agrega una identidad nueva en vivo (después de crearla desde el
             formulario del "+") sin recargar la página. */
          addBuildingLive(item: MapaIdentidadType) {
            const entry = this.makeBuilding(item)
            this.buildings.push(entry)
            this.redrawDynamic()

            /* Mismo lenguaje de "pop" que ya usa popBuilding al entrar a un
               edificio (Back.easeOut) — no un efecto nuevo, el mismo. */
            if (this.reducedMotion) return
            entry.container.setScale(0)
            this.tweens.add({
              targets: entry.container,
              scale: { from: 0, to: 1 },
              duration: 380,
              ease: "Back.easeOut",
            })
          }

          /* Cámara libre: arrastrar sobre espacio vacío mueve la cámara; la
             rueda del mouse o pellizcar con dos dedos hace zoom. */
          setupCameraControls() {
            this.input.on("pointerdown", (pointer: Phaser.Input.Pointer, currentlyOver: Phaser.GameObjects.GameObject[]) => {
              if (currentlyOver.length === 0) this.isPanning = true
            })
            this.input.on("pointerup", () => { this.isPanning = false; this.pinchDistance = 0 })
            this.input.on("pointerupoutside", () => { this.isPanning = false; this.pinchDistance = 0 })
            this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
              const p1 = this.input.pointer1
              const p2 = this.input.pointer2

              /* Pellizco con dos dedos — gana sobre el arrastre de un dedo */
              if (p1.isDown && p2.isDown) {
                this.isPanning = false
                const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y)
                if (this.pinchDistance > 0) {
                  this.zoomBy(dist / this.pinchDistance)
                }
                this.pinchDistance = dist
                return
              }
              this.pinchDistance = 0

              if (!this.isPanning || !pointer.isDown) return
              const cam = this.cameras.main
              cam.scrollX -= (pointer.x - pointer.prevPosition.x) / cam.zoom
              cam.scrollY -= (pointer.y - pointer.prevPosition.y) / cam.zoom
            })
            this.input.on("wheel", (_p: Phaser.Input.Pointer, _go: unknown, _dx: number, deltaY: number) => {
              this.zoomByEased(deltaY > 0 ? 0.9 : 1.1)
            })
          }

          /* Instantáneo — para el pellizco de dos dedos, que ya es un gesto
             continuo; agregarle inercia encima lo haría sentir con retraso. */
          zoomBy(factor: number) {
            const cam = this.cameras.main
            cam.zoom = Phaser.Math.Clamp(cam.zoom * factor, MIN_ZOOM, MAX_ZOOM)
          }

          /* Con inercia — para gestos discretos (un tick de rueda, un click
             en +/-), donde el salto instantáneo se siente brusco. */
          zoomByEased(factor: number) {
            const cam = this.cameras.main
            const target = Phaser.Math.Clamp(cam.zoom * factor, MIN_ZOOM, MAX_ZOOM)
            if (this.reducedMotion) { cam.zoom = target; return }
            this.tweens.add({ targets: cam, zoom: target, duration: 180, ease: "Cubic.easeOut" })
          }

          /* Arrastrar una caja la mueve; arrastrar el fondo de un sector mueve
             TODO el grupo junto. Si el movimiento fue mínimo, cuenta como
             clic normal (entrar a la zona) en vez de arrastre. */
          setupDragControls() {
            this.input.on("dragstart", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
              this.dragMoved = false
              this.dragStartScreen = { x: pointer.x, y: pointer.y }

              const container = gameObject as Phaser.GameObjects.Container
              this.activeDragTarget = container
              if (!this.reducedMotion) {
                this.tweens.add({ targets: container, scale: 1.06, duration: 120, ease: "Cubic.easeOut" })
              }
            })

            this.input.on("drag", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
              const container = gameObject as Phaser.GameObjects.Container
              const moved = Math.hypot(pointer.x - this.dragStartScreen.x, pointer.y - this.dragStartScreen.y)
              if (moved > CLICK_THRESHOLD) this.dragMoved = true

              const sectorInfo = this.sectorContainers.get(container)
              if (sectorInfo) {
                const deltaX = dragX - container.x
                const deltaY = dragY - container.y
                container.x = dragX
                container.y = dragY
                sectorInfo.members.forEach(b => {
                  b.container.x += deltaX
                  b.container.y += deltaY
                })
                const cx = MAP_W / 2, cy = MAP_H / 2
                this.pathsGfx.clear()
                this.pathsGfx.lineStyle(10, 0x0f0a1a, 1)
                this.buildings.forEach(b => this.pathsGfx.lineBetween(b.container.x, b.container.y, cx, cy))
                return
              }

              container.x = dragX
              container.y = dragY
            })

            this.input.on("dragend", (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
              const container = gameObject as Phaser.GameObjects.Container

              this.activeDragTarget = null
              if (!this.reducedMotion) {
                this.tweens.add({ targets: container, scale: 1, duration: 150, ease: "Cubic.easeOut" })
              } else {
                container.setScale(1)
              }

              const sectorInfo = this.sectorContainers.get(container)
              if (sectorInfo) {
                if (this.dragMoved) {
                  const members = sectorInfo.members
                  this.redrawDynamic()
                  Promise.all(
                    members.map(b => updateIdentidadPosicion(b.data.documentId, b.container.x, b.container.y))
                  ).catch(err => console.error("No se pudieron guardar las posiciones del grupo:", err))
                }
                return
              }

              const entry = this.buildings.find(b => b.container === container)
              if (!entry) return

              if (this.dragMoved) {
                this.redrawDynamic()
                updateIdentidadPosicion(entry.data.documentId, entry.container.x, entry.container.y).catch(err => {
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

          update(_time: number, delta: number) {
            if (this.gamePaused) return

            const body  = this.player.body as Phaser.Physics.Arcade.Body
            const SPEED = 165

            body.setVelocity(0)

            const left  = this.cursors.left.isDown  || this.a.isDown
            const right = this.cursors.right.isDown || this.d.isDown
            const up    = this.cursors.up.isDown    || this.w.isDown
            const down  = this.cursors.down.isDown  || this.s.isDown
            const moving = left || right || up || down

            if (left)  body.setVelocityX(-SPEED)
            if (right) body.setVelocityX(SPEED)
            if (up)    body.setVelocityY(-SPEED)
            if (down)  body.setVelocityY(SPEED)
            if ((left || right) && (up || down)) body.velocity.normalize().scale(SPEED)

            /* Bamboleo al caminar — nada de esto si el jugador pidió menos
               movimiento; el desplazamiento en sí (que sí importa para saber
               "dónde estoy") se conserva siempre. */
            if (!this.reducedMotion) {
              if (moving) {
                this.walkT += delta
                const bob = Math.sin(this.walkT / 85) * 0.14
                this.player.setScale(1 - bob * 0.4, 1 + bob)
                this.playerGlow.setScale(1 - bob * 0.4, 1 + bob)
              } else {
                this.walkT = 0
                this.player.setScale(1, 1)
                this.playerGlow.setScale(1, 1)
              }
            }

            this.playerGlow.setPosition(this.player.x, this.player.y)

            let found: BuildingEntry | null = null
            for (const b of this.buildings) {
              if (b.data.placeholder || !b.data.moduleId) continue
              const dx = Math.abs(this.player.x - b.container.x)
              const dy = Math.abs(this.player.y - b.container.y)
              if (dx < BOX_W / 2 + 20 && dy < BOX_H / 2 + 20) { found = b; break }
            }

            /* El edificio al que te puedes acercar "respira" mientras estás
               cerca — refuerzo visual del prompt "[E] ENTRAR", no un efecto
               suelto. Se detiene solo si ese edificio se está arrastrando. */
            if (found !== this.nearBuilding) {
              if (this.nearBuilding) {
                this.nearTween?.stop()
                if (this.nearBuilding.container !== this.activeDragTarget) {
                  this.tweens.add({ targets: this.nearBuilding.container, scale: 1, duration: 160, ease: "Cubic.easeOut" })
                }
              }
              this.nearBuilding = found
              if (found && !this.reducedMotion && found.container !== this.activeDragTarget) {
                this.nearTween = this.tweens.add({
                  targets: found.container,
                  scale: { from: 1, to: 1.045 },
                  duration: 700,
                  yoyo: true,
                  repeat: -1,
                  ease: "Sine.easeInOut",
                })
              }
            }

            if (found) {
              this.prompt.setPosition(found.container.x, found.container.y - BOX_H / 2 - 18).setAlpha(this.prompt.alpha || 0.7)
              if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.nearTween?.stop()
                found.container.setScale(1)
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
          /* activePointers >= 2 — sin esto Phaser solo rastrea un dedo y el
             pellizco para zoom nunca detecta el segundo punto de contacto. */
          input: {
            activePointers: 2,
          },
          /* Click derecho = quitar edificio del mapa (ver makeBuilding) — sin
             esto el navegador abriría su menú contextual encima. */
          disableContextMenu: true,
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
