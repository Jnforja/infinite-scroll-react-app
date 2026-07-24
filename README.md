# Infinite scroll with React and Intersection Observer

A dependency-light infinite-scroll implementation modeled as explicit UI
states and tested around user-visible behavior.

[Live demo](https://jnforja.github.io/infinite-scroll-react-app/) ·
[Read the full article](https://joaoforja.com/articles/how-to-implement-infinite-scroll-in-react)

## Requirements

The application:

- Loads images from the Lorem Picsum API
- Shows progress while a request is running
- Lets the user retry failed requests
- Fetches the next page when the current content has been viewed
- Stops requesting once the API has no more content
- Prevents duplicate requests while another request is in flight

## Design

The UI is represented by four states: idle, loading, error, and finished. A
reducer makes the valid transitions explicit, while an Intersection Observer
detects when the sentinel after the final image enters the viewport.

Modeling the workflow this way keeps request coordination out of the rendered
view and makes edge cases such as retries, terminal states, and duplicate
requests straightforward to test.

## Tests

The test suite covers:

- Loading and terminal-state feedback
- Failed requests and retry behavior
- Exceptions from the request layer
- Intersection Observer configuration
- Multiple pages of results
- Request deduplication while loading
- Preventing requests after the final page

Both `fetch` and `IntersectionObserver` are injected, allowing the tests to
control asynchronous behavior without depending on network or browser timing.

## Run locally

This is a historical case study and its dependencies reflect the React
ecosystem at the time it was written.

```bash
yarn install
yarn start
```

Run the tests:

```bash
yarn test
```

## Stack

React · Hooks · Testing Library · Jest · Intersection Observer · Create React
App

## Status

Archived as an educational case study. For my current work and recent
engineering experience, visit [joaoforja.com](https://joaoforja.com).
