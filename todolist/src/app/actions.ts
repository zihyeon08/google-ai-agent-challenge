'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function classifyTaskDifficulty(taskText: string): Promise<'쉬움' | '중간' | '어려움'> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
    
    const prompt = `
    당신은 사용자의 할 일(To-Do)을 분석하여 난이도를 평가하는 AI 비서입니다.
    다음 할 일의 난이도를 분석하고, 오직 '쉬움', '중간', '어려움' 중 하나의 단어로만 대답해주세요. 부가 설명은 절대 하지 마세요.

    [난이도 평가 기준]
    1. 쉬움: 10분 이내로 끝날 수 있는 단순하고 즉각적인 일, 육체적/정신적 소모가 거의 없는 일 (예: 물 마시기, 숨쉬기, 알람 맞추기)
    2. 중간: 30분~2시간 정도 소요되는 일, 일상적인 노력이나 어느 정도의 집중이 필요한 일 (예: 마트에서 장보기, 방 청소, 이메일 답장하기)
    3. 어려움: 2시간 이상 소요되거나 강도 높은 집중력, 전문 지식, 복잡한 과정이 필요한 일 (예: 프로젝트 기획, 프로그래밍, 논문 작성, 큰 시험 공부)

    할 일: "${taskText}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    if (text.includes('쉬움')) return '쉬움';
    if (text.includes('어려움')) return '어려움';
    return '중간'; // Default fallback
  } catch (error) {
    console.error('Error classifying task:', error);
    return '중간'; // Default fallback on error
  }
}
