// 개인 정보 - 자기소개나 일상 관련 질문이 나왔을 때
// Claude가 실제 내 이야기로 답변을 만들도록 사용된다.
// 비어 있는 항목은 그냥 무시되고 일반적인 내용으로 생성된다.

export const PROFILE = {
  englishName: "Suyeon",
  age: "35 years old",
  gender: "female",
  family: "married, living with my husband and our five-year-old son",
  city:
    "Sangam in Seoul - the neighborhood known for the World Cup Stadium, with lots of parks and wooded hills that make it a really livable area",
  job:
    "I work at Samsung Life Insurance, where my team redesigns the company's business processes using AI - basically taking the work people do manually and reinventing it around AI",
  jobChallenge:
    "I majored in economics, so the technical side of my current work is genuinely challenging and I'm constantly learning on the job",
  homeType:
    "a three-bedroom apartment with an unusually spacious living room, so our family spends almost all our time together in there rather than in separate rooms",
  homeFavorite:
    "our place has a mountain view, so I love throwing the curtains wide open and drinking coffee while looking outside",
  hobbies:
    "planning trips and traveling - honestly, travel is the reason I work; I'm the one who plans every detail of our family trips",
  exercise: "running near the Han River three times a week",
  favoritePlace:
    "the riverside park along the Han River - it's where I go to clear my head and sort out my thoughts",
  personality:
    "bright and outgoing; I genuinely love talking with people",
  englishBackground:
    "I lived abroad often when I was young and have always loved English",
  goalForOpic:
    "I keep getting AL, but I believe my actual level is AH or Superior, and not getting that score is my biggest source of stress",
  extra: "",
};

export function profileSummary() {
  const lines = Object.entries(PROFILE)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v.trim()}`);
  return lines.length ? lines.join("\n") : "";
}
