const routeRequests = {
  stationShirakawaTram: [
    [130.6899, 32.7904],
    [130.6924, 32.78983],
    [130.694, 32.78974],
    [130.7025, 32.7952],
    [130.7106, 32.8031],
  ],
  stationTaheiCastle: [
    [130.6899, 32.7904],
    [130.6928, 32.7944],
    [130.6968, 32.7974],
    [130.7031, 32.8002],
    [130.7106, 32.8031],
  ],
  stationChourokuSouth: [
    [130.6899, 32.7904],
    [130.6985, 32.792],
    [130.7139, 32.7938],
    [130.708, 32.7981],
    [130.7106, 32.8031],
  ],
  karashimaDaikoTram: [
    [130.7055, 32.7981],
    [130.7179, 32.8012],
    [130.7201, 32.7978],
    [130.7304, 32.7948],
    [130.7335, 32.7909],
  ],
  karashimaChourokuHonjo: [
    [130.7055, 32.7981],
    [130.7111, 32.7966],
    [130.7139, 32.7938],
    [130.724, 32.7918],
    [130.7335, 32.7909],
  ],
  karashimaSangyoEast: [
    [130.7055, 32.7981],
    [130.718, 32.8006],
    [130.7399, 32.8046],
    [130.7518, 32.7975],
    [130.7335, 32.7909],
  ],
  suizenjiTramKengun: [
    [130.7335, 32.7909],
    [130.7401, 32.7914],
    [130.751, 32.7885],
    [130.7616, 32.7787],
  ],
  suizenjiHigashiBypass: [
    [130.7335, 32.7909],
    [130.766, 32.796],
    [130.763, 32.781],
    [130.7616, 32.7787],
  ],
  suizenjiSangyoKengun: [
    [130.7335, 32.7909],
    [130.7518, 32.7975],
    [130.7635, 32.7896],
    [130.7616, 32.7787],
  ],
}

function simplifyCoordinates(coordinates, step = 5) {
  return coordinates.filter((_, index) => index === 0 || index === coordinates.length - 1 || index % step === 0)
}

async function fetchRouteGeometry(name, coordinates) {
  const coordinateString = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson&steps=false`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OSRM request failed for ${name}: ${response.status}`)
  }

  const payload = await response.json()
  if (payload.code !== 'Ok' || !payload.routes?.[0]?.geometry?.coordinates) {
    throw new Error(`OSRM returned invalid payload for ${name}`)
  }

  return simplifyCoordinates(payload.routes[0].geometry.coordinates).map(([lng, lat]) => ({
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  }))
}

const geometries = Object.fromEntries(
  await Promise.all(
    Object.entries(routeRequests).map(async ([name, coordinates]) => [name, await fetchRouteGeometry(name, coordinates)]),
  ),
)

process.stdout.write(`${JSON.stringify(geometries, null, 2)}\n`)
