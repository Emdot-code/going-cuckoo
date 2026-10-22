// A safety net around the 3D views. If one of them ever breaks (for example when the page
// reloads halfway through a code change), it shows a small card with a reload button in its
// place, instead of the whole page going blank.

import { Component } from 'react'

export default class SafeView extends Component {
  state = { broken: false }

  static getDerivedStateFromError() {
    return { broken: true }
  }

  componentDidCatch(error) {
    console.error('A 3D view stopped:', error)
  }

  render() {
    if (!this.state.broken) return this.props.children
    return (
      <div className={`panel broken-view ${this.props.className ?? ''}`}>
        <p>{this.props.label} stopped working.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    )
  }
}
