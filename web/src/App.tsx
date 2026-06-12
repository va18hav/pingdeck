import { Route, Routes, useNavigate, useParams } from "react-router-dom"
import { EndpointPanel } from "./features/endpoints/components/EndpointPanel"
import { EndpointsPane } from "./features/endpoints/components/EndpointsPane"
import { useEventStream } from "./features/events/useEventStream"


// App uses the URL as state: "/" shows the pane, /endpoints/:id opens the panel.
export default function App() {
  useEventStream() 
  return (
    <div className="flex h-screen">
      <Routes>
        <Route path="/" element={<EndpointsScreen />} />
        <Route path="/endpoints/:id" element={<EndpointsScreen />} />
      </Routes>
    </div>
  )
}

function EndpointsScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const selectedId = id ?? null

  return (
    <div className="flex min-h-0 flex-1">
      <EndpointsPane
        selectedId={selectedId}
        onSelect={(endpointId) => navigate(`/endpoints/${endpointId}`)}
      />
      {selectedId ? (
        <EndpointPanel id={selectedId} />
      ) : (
        <main className="flex flex-1 items-center justify-center text-ink-3">
          Select an endpoint
        </main>
      )}
    </div>
  )
}
