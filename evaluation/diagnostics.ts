export interface FailedRequest {
  method: string;
  url: string;
  error: string;
  responseStatus?: number;
}

// Chromium can report ERR_ABORTED after a bodyless HEAD response has delivered
// its headers. Run 38331700774 shows this exact event, a successful GET and all
// thirty genuine inferences. Keep it visible; never exempt a failed download.
export function isCompletedModelProbe(
  request: FailedRequest,
  modelUrl: string,
  modelInitialized: boolean,
): boolean {
  return (
    modelInitialized &&
    request.method === "HEAD" &&
    request.url === modelUrl &&
    request.responseStatus === 200 &&
    request.error === "net::ERR_ABORTED"
  );
}
