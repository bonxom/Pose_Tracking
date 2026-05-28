/**
 * Returns a Vietnamese relative time string from a date string.
 * e.g. "Vừa xong", "5 phút", "2 giờ", "3 ngày", "1 tháng", "2 năm"
 */
export function getTimeAgo(dateString) {
  if (!dateString) return "";

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;

  if (diffMs < 0) return "Vừa xong";

  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  if (hours < 24) return `${hours} giờ`;
  if (days < 30) return `${days} ngày`;
  if (months < 12) return `${months} tháng`;
  return `${years} năm`;
}
