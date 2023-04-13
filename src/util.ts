export async function fetchJSON(request: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(request, init);
  if (response.status !== 200)
    throw Error(response.statusText)
  return response.json();
}