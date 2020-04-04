import React from "react";
import {
  render,
  waitForElementToBeRemoved,
  waitFor,
  fireEvent
} from "@testing-library/react";
import { InfiniteScroll } from "./InfiniteScroll";
import { act } from "react-dom/test-utils";

describe("Infinite scroll", () => {
  test("shows loading message when images are being requested", async () => {
    let resolveFetchJson = null;
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          new Promise(res => {
            resolveFetchJson = res;
          })
      })
    );
    const { getByText } = await renderInfiniteScrollAndFetchImages({
      mockFetch
    });
    getByText("Loading...");
    resolveFetchJson([]);
    await waitForElementToBeRemoved(() => getByText("Loading..."));
  });

  test("New requests won't be made while app is loading", async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        status: 200,
        json: () => new Promise(res => {})
      })
    );
    const { observerCallback } = await renderInfiniteScrollAndFetchImages({
      mockFetch
    });

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    triggerLastImageShownToUserCb(observerCallback);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
  });

  test("when there aren't more new images shows no more images message", async () => {
    const { getByText } = await renderInfiniteScrollAndFetchImages({
      imagesRequestBody: []
    });
    return waitFor(() => getByText("There aren't more images"));
  });

  test("when there's an error fetching images, shows button that allows retry", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 500,
      json: () => {
        throw new Error("Should not have been called");
      }
    });
    const { getByText } = await renderInfiniteScrollAndFetchImages({
      mockFetch
    });
    await waitFor(() => getByText("Error! Click to try again"));
    const retryButton = getByText("Error! Click to try again");
    act(() => {
      fireEvent.click(retryButton);
    });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });

  test("when fetching images throws an exception, shows error button", async () => {
    const mockFetch = jest.fn(() => {
      throw new Error("Exception fetching");
    });
    const { getByText } = await renderInfiniteScrollAndFetchImages({
      mockFetch
    });
    return waitFor(() => getByText("Error! Click to try again"));
  });

  test("Calls Intersection Observer with expected values", async () => {
    const {
      mockIntersectionObserver,
      mockObserve,
      getByTestId,
      getByText
    } = await renderInfiniteScrollAndFetchImages({ imagesRequestBody: [] });
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 1 }
    );
    expect(mockObserve).toHaveBeenCalledTimes(1);
    const mockObserveFistArgument = mockObserve.mock.calls[0][0];
    expect(mockObserveFistArgument).toBe(getByTestId("bottom-border"));

    // This call is here to allow all effect to run.
    return waitFor(() => getByText("There aren't more images"));
  });

  test("can fetch and render images multiple times", async () => {
    function* generateImages() {
      yield [
        { download_url: "mockUrl1" },
        { download_url: "mockUrl2" },
        { download_url: "mockUrl3" }
      ];
      yield [
        { download_url: "mockUrl4" },
        { download_url: "mockUrl5" },
        { download_url: "mockUrl6" }
      ];
      return [];
    }
    const imagesSequence = generateImages();
    const mockFetch = jest.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve(imagesSequence.next().value)
    });

    const {
      observerCallback,
      findAllByRole
    } = await renderInfiniteScrollAndFetchImages({
      mockFetch
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenLastCalledWith(
      "https://picsum.photos/v2/list?page=1&limit=5"
    );
    await waitFor(async () =>
      expect((await findAllByRole("img")).length).toBe(3)
    );

    triggerLastImageShownToUserCb(observerCallback);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(mockFetch).toHaveBeenLastCalledWith(
      "https://picsum.photos/v2/list?page=2&limit=5"
    );
    return waitFor(async () =>
      expect((await findAllByRole("img")).length).toBe(6)
    );
  });

  test("fetch is not called if there aren't more images", async () => {
    const {
      mockIntersectionObserver,
      mockFetch,
      getByText
    } = await renderInfiniteScrollAndFetchImages({
      imagesRequestBody: []
    });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    const observerCallback = await getIntersectionObserverCallback(
      mockIntersectionObserver
    );
    await waitFor(() => getByText("There aren't more images"));
    triggerLastImageShownToUserCb(observerCallback);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

async function renderInfiniteScrollAndFetchImages(args) {
  const renderResult = renderInfiniteScroll(args);
  const observerCallback = await getIntersectionObserverCallback(
    renderResult.mockIntersectionObserver
  );
  triggerLastImageShownToUserCb(observerCallback);
  return {
    ...renderResult,
    observerCallback
  };
}

function triggerLastImageShownToUserCb(observerCallback) {
  act(() => observerCallback([{ intersectionRatio: 1 }]));
}

async function getIntersectionObserverCallback(mockIntersectionObserver) {
  await waitFor(() => expect(mockIntersectionObserver).toHaveBeenCalled());
  return mockIntersectionObserver.mock.calls[0][0];
}

function renderInfiniteScroll({
  imagesRequestStatus = 200,
  imagesRequestBody = [],
  mockFetch = jest.fn(() =>
    Promise.resolve({
      status: imagesRequestStatus,
      json: () => Promise.resolve(imagesRequestBody)
    })
  )
} = {}) {
  const mockObserve = jest.fn();
  const mockIntersectionObserver = jest.fn(() => ({ observe: mockObserve }));
  return {
    ...render(
      <InfiniteScroll
        fetch={mockFetch}
        IntersectionObserver={mockIntersectionObserver}
      />
    ),
    mockFetch,
    mockIntersectionObserver,
    mockObserve
  };
}
