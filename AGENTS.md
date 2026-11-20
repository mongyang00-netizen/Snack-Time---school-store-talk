# AGENTS.md

## Supabase Database & Table Access Guidelines

앞으로 Supabase에서 새로운 테이블을 생성하거나 SQL 마이그레이션을 작성·실행하고 테이블에 액세스할 때는 아래 두 가지 규칙을 **항상** 적용해야 합니다.

### 1. PostgREST API 접근을 위한 명시적 `GRANT` 구문 필수 포함
- `anon` 및 `authenticated` 역할(Role)이 Supabase PostgREST API를 통해 테이블에 접근할 수 있도록 명시적인 `GRANT` SQL 문(`SELECT`, `INSERT`, `UPDATE`, `DELETE` 등)을 반드시 포함합니다.
- 스키마 및 시퀀스(예: `SERIAL`, `IDENTITY` 등)를 사용하는 경우 필요한 `USAGE` 권한도 함께 부여합니다.

```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.<table_name> TO anon, authenticated;
```

### 2. RLS(Row Level Security) 활성화 및 `authenticated` 전용 Policy 작성
- 모든 테이블에 대해 RLS를 반드시 활성화(`ENABLE ROW LEVEL SECURITY`)합니다.
- 인증된 유저(`authenticated`)만 데이터를 읽고 쓸 수 있도록 명시적인 Policy를 작성합니다. (유저 본인 소유 데이터인 경우 `auth.uid() = user_id` 등으로 소유권 검증을 함께 적용합니다.)

```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- 인증된 유저(authenticated)만 조회 가능
CREATE POLICY "Authenticated users can select"
  ON public.<table_name>
  FOR SELECT
  TO authenticated
  USING (true); -- 본인 데이터만 허용 시: (auth.uid() = user_id)

-- 인증된 유저(authenticated)만 생성 가능
CREATE POLICY "Authenticated users can insert"
  ON public.<table_name>
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- 본인 데이터만 허용 시: (auth.uid() = user_id)

-- 인증된 유저(authenticated)만 수정 가능
CREATE POLICY "Authenticated users can update"
  ON public.<table_name>
  FOR UPDATE
  TO authenticated
  USING (true)       -- 본인 데이터만 허용 시: (auth.uid() = user_id)
  WITH CHECK (true); -- 본인 데이터만 허용 시: (auth.uid() = user_id)

-- 인증된 유저(authenticated)만 삭제 가능
CREATE POLICY "Authenticated users can delete"
  ON public.<table_name>
  FOR DELETE
  TO authenticated
  USING (true); -- 본인 데이터만 허용 시: (auth.uid() = user_id)
```

### 체크리스트
- [ ] `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ... TO anon, authenticated;` 포함 여부
- [ ] `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` 포함 여부
- [ ] `TO authenticated` 대상 `SELECT` / `INSERT` / `UPDATE` / `DELETE` RLS Policy 작성 여부
