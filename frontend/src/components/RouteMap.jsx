import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

export default function RouteMap({ stops = [], height = 220 }) {
  const mapRef = useRef(null)
  const containerRef = useRef(null)
  const controlRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    let mounted = true

    async function init() {
      const leaflet = await import('leaflet')
      await import('leaflet-routing-machine')
      if (!mounted) return
      const L = leaflet.default || leaflet

      if (!mapRef.current) {
        const first = stops[0] ?? { lat: -33.45, lng: -70.65 }
        mapRef.current = L.map(containerRef.current, {
          center: [first.lat ?? -33.45, first.lng ?? -70.65],
          zoom: 12,
        })
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current)
      }

      const map = mapRef.current
      if (controlRef.current) {
        map.removeControl(controlRef.current)
        controlRef.current = null
      }
      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }

      const validStops = stops.filter(
        (s) => s?.lat != null && s?.lng != null
      )

      if (validStops.length >= 2) {
        const waypoints = validStops.map((stop) =>
          L.latLng(stop.lat, stop.lng)
        )
        controlRef.current = L.Routing.control({
          waypoints,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          routeWhileDragging: false,
          show: false,
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
          }),
          createMarker: (i, waypoint) => {
            const stop = validStops[i]
            const marker = L.marker(waypoint.latLng, {
              draggable: false,
              title: stop?.label || '',
            })
            const tooltip =
              stop?.type === 'dropoff'
                ? '🎯'
                : String(i + 1)
            marker.bindTooltip(tooltip, {
              permanent: true,
              direction: 'top',
              className: 'route-map-marker',
            })
            if (stop?.label || stop?.address) {
              marker.bindPopup(
                `<strong>${stop.label || ''}</strong>${
                  stop.address ? `<br/>${stop.address}` : ''
                }`
              )
            }
            return marker
          },
        }).addTo(map)
      } else if (validStops.length === 1) {
        const stop = validStops[0]
        markerRef.current = L.marker([stop.lat, stop.lng], {
          title: stop.label || '',
        })
          .addTo(map)
        if (stop?.label || stop?.address) {
          markerRef.current.bindPopup(
            `<strong>${stop.label || ''}</strong>${
              stop.address ? `<br/>${stop.address}` : ''
            }`
          )
        }
        markerRef.current.bindTooltip('🎯', {
          permanent: true,
          direction: 'top',
          className: 'route-map-marker',
        })
        map.setView([stop.lat, stop.lng], 14)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [stops])

  useEffect(() => () => {
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border"
      style={{ height }}
    />
  )
}
