export const queryString = (params: Record<string, any>): string => {
  const query = Object.entries(params)
    .filter(([, value]) => Boolean(value)) // bỏ giá trị falsy
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
    .join('&')

  return query ? `?${query}` : ''
}
