import React, { useEffect, useCallback } from "react";
import { useReducer } from "react";

const startFetch = "START_FETCH";
const fetchSuccess = "FETCH_SUCCESS";
const errorFetch = "FETCH_ERROR";
const reachedEnd = "REACHED_END";

const idleStatus = "IDLE";
const errorStatus = "ERROR";
const loadingStatus = "LOADING";
const finishedStatus = "FINISHED";

function infiniteScrollReducer(state, action) {
  switch (state.status) {
    case idleStatus:
    case errorStatus:
      return action.type === startFetch
        ? { ...state, status: loadingStatus }
        : state;

    case loadingStatus:
      if (action.type === errorFetch) {
        return { ...state, status: errorStatus };
      }
      if (action.type === reachedEnd) {
        return { ...state, status: finishedStatus };
      }
      if (action.type === fetchSuccess) {
        return {
          ...state,
          imagesUrls: [...state.imagesUrls, ...action.payload.imagesUrls],
          pageNumber: state.pageNumber + 1,
          status: idleStatus,
        };
      }
      return state;
    case finishedStatus:
      return state;
    default:
      throw new Error("Unknown state");
  }
}

async function fetchImages(state, dispatch, fetch) {
  try {
    const res = await fetch(
      `https://picsum.photos/v2/list?page=${state.pageNumber}&limit=5`
    );
    if (res.status === 200) {
      const imgs = await res.json();
      if (imgs.length === 0) {
        return dispatch({ type: reachedEnd });
      }
      return dispatch({
        type: fetchSuccess,
        payload: { imagesUrls: imgs.map((i) => i.download_url) },
      });
    } else {
      dispatch({ type: errorFetch });
    }
  } catch (e) {
    dispatch({ type: errorFetch });
  }
}

const initialState = { imagesUrls: [], status: idleStatus, pageNumber: 1 };

function InfiniteScroll({
  fetch = window.fetch,
  IntersectionObserver = window.IntersectionObserver,
}) {
  const [state, dispatch] = useReducer(infiniteScrollReducer, initialState);
  useEffect(() => {
    if (state.status === loadingStatus) {
      fetchImages(state, dispatch, fetch);
    }
  }, [fetch, state]);

  const observeBorder = useCallback(
    (node) => {
      if (node !== null) {
        new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.intersectionRatio === 1) {
                dispatch({ type: startFetch });
              }
            });
          },
          { threshold: 1 }
        ).observe(node);
      }
    },
    [IntersectionObserver]
  );

  return (
    <>
      {renderImages()}
      {state.status === errorStatus && renderErrorRetryButton()}
      {state.status === loadingStatus && renderLoadingMessage()}
      {state.status === finishedStatus && renderNoMoreImagesMessage()}
      {renderBottomBorder()}
    </>
  );

  function renderBottomBorder() {
    return <div data-testid="bottom-border" ref={observeBorder} />;
  }

  function renderNoMoreImagesMessage() {
    return <p>There aren't more images</p>;
  }

  function renderImages() {
    return state.imagesUrls.map((url) => (
      <img key={url} style={imageStyle} src={url} alt="mock alt" />
    ));
  }

  function renderErrorRetryButton() {
    return (
      <button type="button" onClick={() => dispatch({ type: startFetch })}>
        Error! Click to try again
      </button>
    );
  }

  function renderLoadingMessage() {
    return <p>Loading...</p>;
  }
}

const imageStyle = {
  width: "300px",
  height: "200px",
  display: "block",
  marginBottom: "20px",
};
export { InfiniteScroll };
