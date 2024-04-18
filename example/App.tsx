import {useState} from 'react'
import reactLogo from './assets/react.svg'
import {PIPPortal} from '../src/PIPPortal'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle PIP Window</button>
      <h1>React PIP</h1>
      <div>
        <a href="https://react.dev" target="_blank">
          <img
            src={reactLogo}
            className="fx-spin logo react"
            alt="React logo"
          />
        </a>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>

      {isOpen && (
        <PIPPortal
          width={450}
          height={235}
          // disallowReturnToOpener
          onClose={() => setIsOpen(false)}
        >
          <div>
            <div>
              <a href="https://react.dev" target="_blank">
                <img
                  src={reactLogo}
                  className="fx-spin logo react"
                  alt="React logo"
                />
              </a>
            </div>
            <div className="card">
              <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </button>
            </div>
          </div>
        </PIPPortal>
      )}
    </>
  )
}

export default App
