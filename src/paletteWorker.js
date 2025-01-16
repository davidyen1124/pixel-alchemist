// Median Cut algorithm and helper functions
function medianCut(pixelArray, desiredColors) {
  let boxes = [
    { pixelArray, rMin: 255, rMax: 0, gMin: 255, gMax: 0, bMin: 255, bMax: 0 }
  ]

  updateBoxRange(boxes[0])

  while (boxes.length < desiredColors) {
    const boxToSplit = findBoxWithLargestRange(boxes)
    if (!boxToSplit) break

    const rRange = boxToSplit.rMax - boxToSplit.rMin
    const gRange = boxToSplit.gMax - boxToSplit.gMin
    const bRange = boxToSplit.bMax - boxToSplit.bMin
    let axis = 'r'
    if (gRange >= rRange && gRange >= bRange) axis = 'g'
    if (bRange >= rRange && bRange >= gRange) axis = 'b'

    boxToSplit.pixelArray.sort((a, b) => {
      if (axis === 'r') return a[0] - b[0]
      if (axis === 'g') return a[1] - b[1]
      return a[2] - b[2]
    })

    const medianIndex = Math.floor(boxToSplit.pixelArray.length / 2)
    const pixelArrayA = boxToSplit.pixelArray.slice(0, medianIndex)
    const pixelArrayB = boxToSplit.pixelArray.slice(medianIndex)

    const boxA = {
      pixelArray: pixelArrayA,
      rMin: 255,
      rMax: 0,
      gMin: 255,
      gMax: 0,
      bMin: 255,
      bMax: 0
    }
    const boxB = {
      pixelArray: pixelArrayB,
      rMin: 255,
      rMax: 0,
      gMin: 255,
      gMax: 0,
      bMin: 255,
      bMax: 0
    }

    updateBoxRange(boxA)
    updateBoxRange(boxB)

    boxes = boxes.filter((b) => b !== boxToSplit)
    if (pixelArrayA.length > 0) boxes.push(boxA)
    if (pixelArrayB.length > 0) boxes.push(boxB)

    if (pixelArrayA.length === 0 || pixelArrayB.length === 0) break
  }

  return boxes.map((b) => averageColor(b.pixelArray))
}

function findBoxWithLargestRange(boxes) {
  let maxRange = -1
  let boxToSplit = null
  for (let b of boxes) {
    const rRange = b.rMax - b.rMin
    const gRange = b.gMax - b.gMin
    const bRange = b.bMax - b.bMin
    const range = Math.max(rRange, gRange, bRange)
    if (range > maxRange && b.pixelArray.length > 1) {
      maxRange = range
      boxToSplit = b
    }
  }
  return boxToSplit
}

function updateBoxRange(box) {
  for (let [r, g, b] of box.pixelArray) {
    if (r < box.rMin) box.rMin = r
    if (r > box.rMax) box.rMax = r
    if (g < box.gMin) box.gMin = g
    if (g > box.gMax) box.gMax = g
    if (b < box.bMin) box.bMin = b
    if (b > box.bMax) box.bMax = b
  }
}

function averageColor(pixels) {
  if (pixels.length === 0) return [0, 0, 0]
  let rSum = 0,
    gSum = 0,
    bSum = 0
  for (let [r, g, b] of pixels) {
    rSum += r
    gSum += g
    bSum += b
  }
  const count = pixels.length
  return [
    Math.round(rSum / count),
    Math.round(gSum / count),
    Math.round(bSum / count)
  ]
}

self.onmessage = function (e) {
  const { imageData, desiredColors } = e.data

  const pixelArray = []
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    pixelArray.push([data[i], data[i + 1], data[i + 2]])
  }

  const palette = medianCut(pixelArray, desiredColors)

  self.postMessage(palette)
}
