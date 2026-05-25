export class QueryExpander {
  /**
   * 베이스 질문으로부터 다각화된 5개 검색 변형어를 생성합니다.
   * AI 및 SEO 질의 변형을 모사하여 동의어, 조사 생략, 영문 결합형을 포함합니다.
   */
  public expand(baseQuestion: string, targetKeyword: string): string[] {
    const text = baseQuestion.replace(/{brand}/g, targetKeyword);
    const words = text.split(" ").filter(w => w.length > 1);

    return [
      text, // 원본
      words.join(" "), // 조사 제거 공백 결합
      `${targetKeyword} ${words[words.length - 1] || "추천"}`, // 브랜드 + 핵심 키워드
      `${targetKeyword} 솔직 후기 추천`, // 브랜드 + 후기/추천 의도
      `Best ${targetKeyword.replace(/[^a-zA-Z0-9]/g, "") || "Brand"} comparison`, // 글로벌 영문 검색 패턴
    ];
  }
}
