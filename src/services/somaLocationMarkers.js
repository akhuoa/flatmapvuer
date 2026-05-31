const SOMA_MARKER_COLOUR = '#1b7f6b'
const SOMA_MARKER_SECONDARY_COLOUR = '#f4f1de'
const SOMA_MARKER_TEXT_COLOUR = '#12312b'
const SOMA_MARKER_MAX_COUNT_LABEL = '99+'

const normalizeSomaLocations = function (somaLocations) {
  return (Array.isArray(somaLocations) ? somaLocations : [])
    .map((item) => ({
      label: String(item?.label || '').trim(),
      curie: String(item?.curie || '').trim(),
      count: Number(item?.count || 0),
    }))
    .filter((item) => item.curie && item.count > 0)
}

const formatCount = function (count) {
  if (count > 99) return SOMA_MARKER_MAX_COUNT_LABEL
  return String(count)
}

const createSomaLocationMarkerElement = function (somaLocation) {
  const wrapper = document.createElement('div')
  wrapper.className = 'flatmapvuer-soma-location-marker'
  wrapper.title = somaLocation.label || somaLocation.curie
  wrapper.style.width = '34px'
  wrapper.style.height = '48px'
  wrapper.style.display = 'flex'
  wrapper.style.alignItems = 'center'
  wrapper.style.justifyContent = 'center'
  wrapper.style.transform = 'translate(-50%, -100%)'

  const countLabel = formatCount(somaLocation.count)
  wrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 27 42" width="34" height="48" aria-hidden="true">
    <ellipse style="fill: rgb(0, 0, 0); fill-opacity: 0.18;" cx="12" cy="36" rx="8" ry="4"/>
    <path d="M12.25.25a12.254 12.254 0 0 0-12 12.494
             c0 6.444 6.488 12.109 11.059 22.564.549 1.256 1.333 1.256 1.882 0
             C17.762 24.853 24.25 19.186 24.25 12.744A12.254 12.254 0 0 0 12.25.25Z"
          style="fill:${SOMA_MARKER_COLOUR};stroke:${SOMA_MARKER_SECONDARY_COLOUR};stroke-width:1.1"/>
    <circle cx="12.5" cy="12.5" r="8" fill="${SOMA_MARKER_SECONDARY_COLOUR}"/>
    <text x="12.5" y="16.1" text-anchor="middle" style="font-size:7.5px;font-weight:700;fill:${SOMA_MARKER_TEXT_COLOUR};font-family:Arial, sans-serif">${countLabel}</text>
  </svg>`

  return wrapper
}

const resolveMarkerPlacement = function (mapImp, curie) {
  const featureIds = Array.isArray(mapImp?.modelFeatureIds?.(curie)) ? mapImp.modelFeatureIds(curie) : []
  for (const featureId of featureIds) {
    const annotation = mapImp.annotation(featureId)
    if (annotation?.uri) {
      return {
        type: 'feature-uri',
        value: annotation.uri,
      }
    }
  }

  if (featureIds.length === 1) {
    return {
      type: 'model',
      value: curie,
    }
  }

  return null
}

export const attachSomaLocationMarkerMethods = function (mapImp) {
  if (!mapImp || mapImp.addSomaLocationMarkers) {
    return mapImp
  }

  let markerIds = []

  mapImp.clearSomaLocationMarkers = function () {
    markerIds.forEach((markerId) => {
      mapImp.removeMarker(markerId)
    })
    markerIds = []
  }

  mapImp.addSomaLocationMarkers = function (somaLocations) {
    const normalizedSomaLocations = normalizeSomaLocations(somaLocations)
    const placedSomaLocations = []

    mapImp.clearSomaLocationMarkers()

    normalizedSomaLocations.forEach((somaLocation) => {
      const placement = resolveMarkerPlacement(mapImp, somaLocation.curie)
      if (!placement) return

      const markerElement = createSomaLocationMarkerElement(somaLocation)
      let addedMarkerIds = []

      if (placement.type === 'feature-uri') {
        addedMarkerIds = mapImp.addMarkerByFeatureUri(placement.value, { element: markerElement })
      } else if (placement.type === 'model') {
        const markerId = mapImp.addMarker(placement.value, { element: markerElement })
        addedMarkerIds = markerId > -1 ? [markerId] : []
      }

      if (!addedMarkerIds.length) return

      markerIds.push(...addedMarkerIds)
      placedSomaLocations.push(somaLocation)
    })

    return placedSomaLocations
  }

  return mapImp
}
