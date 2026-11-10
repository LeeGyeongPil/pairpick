# 보안 정책 / Security policy

보안 취약점을 발견하셨다면 **공개 이슈 대신** 이 레포의 **Security → Report a vulnerability**(비공개 취약점 신고)로 알려 주세요. 확인 후 답변드리고, 고친 버전을 릴리스하면서 함께 안내합니다.

If you find a security issue, please **do not open a public issue**. Use **Security → Report a vulnerability** in this repository to report it privately. We will reply after checking and announce the fix with a release.

pairpick은 정적 브라우저 앱이며 데이터는 브라우저 밖으로 나가지 않습니다. `npm run dev` 개발 서버는 기본적으로 localhost에서만 열립니다. / pairpick is a static browser app and your data never leaves the browser. The `npm run dev` server listens on localhost only by default.
