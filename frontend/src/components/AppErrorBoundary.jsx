import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('The app encountered a rendering error.', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="grid min-h-screen place-items-center bg-slate-100 px-4 text-slate-900">
          <section className="max-w-md rounded-sm border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="font-display text-3xl font-bold">This page hit a problem</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Your sign-in is still saved. Reload the page to try again.</p>
            <button className="mt-5 rounded-sm bg-sky-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-900" type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
