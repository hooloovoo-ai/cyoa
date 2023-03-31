export async function fetchJSON(request: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(request, init);
  return response.json();
}