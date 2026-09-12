// 개인 정보 - 자기소개나 일상 관련 질문이 나왔을 때
// Claude가 실제 내 이야기로 답변을 만들도록 사용된다.
// 비어 있는 항목은 그냥 무시되고 일반적인 내용으로 생성된다.

export const PROFILE = {
  englishName: "", // 예: "Alex" (오픽에서 쓸 영어 이름)
  age: "", // 예: "late twenties"
  job: "", // 예: "a marketing manager at a mid-sized IT company"
  city: "", // 예: "Suwon, just south of Seoul"
  livingWith: "", // 예: "my parents and my younger sister"
  homeType: "", // 예: "a 3-bedroom apartment on the 12th floor"
  hobbies: "", // 예: "watching movies at home, hiking on weekends, playing guitar"
  exercise: "", // 예: "jogging along the river three times a week"
  favoritePlace: "", // 예: "a quiet cafe near my office"
  recentTrip: "", // 예: "Osaka last spring with two college friends"
  personality: "", // 예: "quiet at first but talkative once I get comfortable"
  goalForOpic: "", // 예: "AL for a job application"
  extra: "", // 그 밖에 답변에 자주 등장시키고 싶은 내 이야기
};

export function profileSummary() {
  const lines = Object.entries(PROFILE)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v.trim()}`);
  return lines.length ? lines.join("\n") : "";
}
