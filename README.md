# Pipe Selector (배관 재질, 규격 및 두께 선정 툴)

본 애플리케이션은 공정설계 엔지니어가 입력한 유체 정보, 온도, 압력, 유량, 유속 등의 설계 조건에 맞춰 **화학적 재질 적합성**, **배관 구경(Size)**, **최소 요구 두께(Schedule)**를 자동으로 계산 및 추천해 주는 웹 기반의 엔지니어링 설계 툴입니다.

---

## 1. 주요 기능

1.  **유체 검색 및 화학적 재질 적합성 판정 (Chemical Compatibility)**:
    - 380종의 유체 데이터베이스를 바탕으로 금속 재질 9종 및 가스켓용 탄성 재질 10종의 화학적 호환성 등급(A~E)을 제공합니다.
    - 화학적으로 적절한 재질(A: Excellent, B: Good 등급)만 설계 후보군으로 자동 필터링됩니다.
2.  **배관 구경 계산 및 선정 (Pipe Sizing)**:
    - 설계 유량($Q$)과 타겟 유속($V$)을 바탕으로 필요한 최소 내경($D_{req}$)을 계산합니다:
      $$D_{req} = \sqrt{\frac{4 \cdot Q}{\pi \cdot V}}$$
    - ASME B36.10 및 B36.19 표준 배관 치수 데이터베이스를 탐색하여 조건에 부합하는 호칭경(NPS)들을 제시합니다.
3.  **ASME B31.3 기준 배관 최소 두께 계산 (Wall Thickness)**:
    - 운전 온도에 따른 재질별 허용 응력($S$)을 선형 보간법(Linear Interpolation)으로 산출합니다. (A106 Gr. B, A333 Gr. 6, SS 304, SS 316, A335 P22 지원)
    - ASME B31.3 규격식에 따라 설계 압력에 대한 최소 두께($t_{design}$)를 계산합니다:
      $$t_{design} = \frac{P \cdot D}{2(S \cdot E + P \cdot Y)}$$
    - 엔지니어가 설정한 부식 여유(Corrosion Allowance)와 배관 제조 허용 공차(Mill Tolerance, $-12.5\%$)를 반영하여 최종 요구 공칭 두께($t_{nom\_req}$)를 산출합니다:
      $$t_{nom\_req} = \frac{t_{design} + c}{0.875}$$
    - 계산된 두께 이상의 표준 Schedule(Sch 40, Sch 80 등)을 매칭해 줍니다.
4.  **실시간 단면 가시화 (Pipe Section Visualizer)**:
    - 선택된 배관 규격의 외경(OD), 내경(ID), 강관 두께, 부식 한계선(Corrosion Limit)을 SVG 그래픽으로 실시간 드로잉하여 시각적으로 검토할 수 있습니다.
5.  **종합 사양서(Specification Sheet) 출력**:
    - 설계 조건과 계산 결과를 정리한 사양서를 깔끔한 인쇄 레이아웃(Print Layout)으로 프린트하거나 PDF로 저장할 수 있습니다.
6.  **대화형 호환성 스프레드시트 뷰**:
    - 상단 `Compatibility Sheet View` 버튼 클릭 시, 380종 전체 유체의 재질별 적합성 등급을 그리드 형태로 일괄 조회하고 실시간 검색할 수 있는 전체 시트가 표시됩니다.

---

## 2. 사용 방법

### 애플리케이션 실행
애플리케이션은 100% 로컬 환경에서 구동 가능하며, 별도의 데이터베이스 설정이 필요 없습니다.

- **방법 1 (서버 구동 - 권장)**: 
  프로젝트 폴더 내의 **`run_server.bat`** 파일을 더블클릭합니다. 로컬 웹 서버가 실행되며 브라우저에 자동으로 주소(`http://localhost:8000`)가 열립니다.
- **방법 2 (로컬 다이렉트 실행)**: 
  **`index.html`** 파일을 더블클릭하여 브라우저에서 바로 실행합니다. (CORS 보안 오류 없이 모든 데이터가 로컬 변수로 로드됩니다.)

### 설계 절차
1.  **유체 서비스 선택 (Fluid Service)**:
    - 좌측 입력란의 유체 선택창에서 설계 유체명을 검색하거나 입력하여 선택합니다.
2.  **설계 조건 입력 (Design Conditions)**:
    - 설계 압력(Pressure)과 온도(Temperature), 부식 여유(Corrosion Allowance)를 설정합니다. 단위를 토글하여 (bar, psi, MPa, kg/cm² / °C, °F) 입력할 수 있습니다.
3.  **수력학적 조건 입력 (Hydraulic Conditions)**:
    - volumetric 유량(Flow Rate) 및 추천 설계 유속(Target Velocity)을 입력합니다.
4.  **결과 확인 및 조정**:
    - 입력 즉시 상단 요약 카드와 메인 테이블의 계산 결과가 갱신됩니다.
    - 계산 결과 테이블에서 다른 규격을 클릭하여 원하는 사양을 탐색하고, SVG 단면도 및 상세 설계 검토서(Piping Specification Sheet)를 확인합니다.
    - 하단의 `Print Spec Sheet` 버튼을 눌러 인쇄하거나 PDF 파일로 출력합니다.
5.  **재질 호환성 스프레드시트 다운로드**:
    - `Compatibility Sheet View` 모달 우측 상단의 `Download Excel` 버튼을 클릭하면, 전체 380종의 호환성 매트릭스가 정리된 [fluid_compatibility_matrix.xlsx](fluid_compatibility_matrix.xlsx) 파일을 즉시 내보낼 수 있습니다.

---

## 3. 파일 및 폴더 구조

- `index.html`: 메인 웹 애플리케이션 프레임워크 및 마크업
- `css/style.css`: 모던 반응형 CSS 스타일시트 (다크 모드, 글래스모피즘 테마)
- `js/app.js`: ASME 계산 엔진, 단위 변환, SVG 가시화 및 UI 이벤트 핸들러
- `js/data.js`: 380종 유체 호환성 및 표준 배관 치수 데이터베이스
- `fluid_compatibility_matrix.xlsx` / `fluid_compatibility_matrix.csv`: 전체 호환성 매트릭스 스프레드시트 파일
- `run_server.bat`: 로컬 개발 서버 간편 실행 배치 스크립트
- `.gitignore`: Git 소스 추적 제외 설정 파일
