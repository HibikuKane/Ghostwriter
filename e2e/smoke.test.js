import { test, expect } from '@playwright/test';

/**
 * Smoke Test — 앱 로드 및 로그인 전 화면 검증
 *
 * Google OAuth는 실제 credentials 없이 자동화 불가.
 * 이 테스트는 "앱이 정상적으로 서빙되고, 로그인 UI가 렌더링되는가"를 확인한다.
 */
test('앱 로드 및 로그인 화면 렌더링', async ({ page }) => {
    await page.goto('/');

    // 페이지 타이틀
    await expect(page).toHaveTitle('Ghostwriter - Handshake');

    // 헤더 타이틀
    await expect(page.locator('h1')).toContainText('Ghostwriter');

    // 로그인 버튼 표시
    const authBtn = page.locator('#auth-btn');
    await expect(authBtn).toBeVisible();
    await expect(authBtn).toContainText('Login with Google');

    // 로그아웃 상태: dashboard 숨김, auth-section 표시
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(page.locator('#dashboard-section')).toHaveClass(/hidden/);
});
