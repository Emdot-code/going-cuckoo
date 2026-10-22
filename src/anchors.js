// Pins ordinary page elements (the tower's display, the demon's speech bubble, the z z z) to
// points in the 3D city. A panel registers itself with anchorRef(point); every frame, the 3D
// scene works out where that point is on the screen and moves the element there
// (PlaceAnchors in CityScene.jsx). The scene also sets the CSS variable --u: how many pixels one
// metre takes on the screen, so the display can be sized to fit the tower.

import * as THREE from 'three'

export const anchors = new Set()

// point: [x, y, z] in metres. Use it as an element's ref.
export const anchorRef = (point) => (el) => {
  for (const a of anchors) if (a.el === el || !a.el.isConnected) anchors.delete(a)
  if (el) anchors.add({ el, point })
}

// The 3D camera and the size of the view, kept up to date by the scene.
export const view = { camera: null, size: null }

// Where a point in the city is on the screen, in pixels (or null before the city is drawn).
export function toScreen(point) {
  if (!view.camera) return null
  const v = new THREE.Vector3(...point).project(view.camera)
  return { x: ((v.x + 1) / 2) * view.size.width, y: ((1 - v.y) / 2) * view.size.height }
}
