export function noteTextColor(hex: string): "#1A1A1A" | "#FFFFFF" {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? "#1A1A1A" : "#FFFFFF";
}

export function noteTextColorWarm(hex: string): "#3D1F0F" | "#FFFFFF" {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? "#3D1F0F" : "#FFFFFF";
}
