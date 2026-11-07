import { card, expect, halo, portal, rememberGenres, sidewaysOverflow, signIn, test, USER_ID } from './fixtures';

test.describe('at 1440 px', () => {
  test('the home page shows games, styled and with no sideways scroll', async ({ page }) => {
    await page.goto('/');

    await expect(card(page, 'Portal')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'All Games', level: 1 })).toBeVisible();
    await expect(page).toHaveTitle('Nexus Codex | The Ultimate Game Library');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'All Games', level: 1 })).toHaveCSS('font-weight', '700');
    await expect(page.locator('body')).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    expect(await sidewaysOverflow(page)).toBe(0);
  });

  test('a deep link opens the game, and closing it clears the URL', async ({ page }) => {
    await page.goto('/?game=1');

    await expect(page.getByRole('heading', { name: 'Portal', level: 1 })).toBeVisible();
    await expect(page).toHaveTitle('Portal | Nexus Codex');

    await page.getByRole('button', { name: 'Close', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Portal', level: 1 })).toBeHidden();
    await expect(page).toHaveURL('/');
  });

  test('a filter reaches the API, and a genre link changes the page', async ({ page, context, outside }) => {
    await rememberGenres(context);
    await page.goto('/');
    await expect(card(page, 'Portal')).toBeVisible();

    await page.getByRole('button', { name: 'Platform' }).click();
    await page.getByRole('button', { name: 'Xbox' }).click();
    await expect.poll(() => outside.gameRequests.at(-1)?.get('parent_platforms')).toBe('3');

    await page.getByRole('link', { name: /action/i }).first().click();

    await expect(page).toHaveURL('/genre/action');
    await expect(page.getByRole('heading', { name: 'Action', level: 1 })).toBeVisible();
    await expect.poll(() => outside.gameRequests.at(-1)?.get('genres')).toBe('action');
  });

  test('a guest\'s favorite survives a reload and shows on the collection page', async ({ page }) => {
    await page.goto('/');
    await card(page, 'Portal').hover();
    await card(page, 'Portal').getByRole('button', { name: 'Add to favorites' }).click();
    await expect(card(page, 'Portal').getByRole('button', { name: 'Remove from favorites' })).toBeVisible();

    await page.goto('/collection');
    await expect(card(page, 'Portal')).toBeVisible();
    await page.reload();

    await expect(card(page, 'Portal')).toBeVisible();
    await expect(page.getByText('1 game in All')).toBeVisible();
    await expect(page.getByText('Cloud Sync Disabled')).toBeVisible();
  });

  test('sign-in sends a magic link', async ({ page, outside }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByPlaceholder('Enter your email address').fill('player@gmail.com');
    await page.getByRole('button', { name: /Send Magic Link/ }).click();

    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    expect(outside.magicLinks).toMatchObject([{ email: 'player@gmail.com' }]);
  });

  test('an expired magic link explains itself and tidies the address', async ({ page }) => {
    await page.goto('/#error=access_denied&error_code=otp_expired');

    await expect(page.getByText('This magic link has expired. Please try signing in again.')).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('a signed-in user gets their cloud list, and signing out clears the screen', async ({ page, context, outside }) => {
    outside.cloudRows.collections = [{
      user_id: USER_ID,
      game_id: halo.id,
      collection_name: 'playing',
      name: halo.name,
      slug: halo.slug,
      background_image: halo.background_image,
      metacritic: halo.metacritic,
      parent_platforms: halo.parent_platforms,
    }];
    await signIn(context);
    await page.goto('/collection');

    await expect(card(page, 'Halo')).toBeVisible();
    await expect(page.getByText('Cloud Sync Disabled')).toBeHidden();

    await page.getByRole('button', { name: 'User Menu' }).click();
    await page.getByRole('button', { name: 'Sign Out' }).click();

    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(card(page, 'Halo')).toBeHidden();
    expect(outside.signOuts).toBe(1);
  });

  test('with the API down, the grid explains and saved games still show', async ({ page, outside }) => {
    await page.goto('/');
    await card(page, 'Portal').hover();
    await card(page, 'Portal').getByRole('button', { name: 'Add to favorites' }).click();
    outside.apiDown = true;
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Failed to connect to Nexus' })).toBeVisible();

    await page.getByRole('link', { name: /View Collections Cache/ }).click();

    await expect(card(page, 'Portal')).toBeVisible();
  });

  test('on a first visit, the visible sidebar lists the genres (BUG-33, fixed)', async ({ page }) => {
    await page.goto('/');
    await expect(card(page, 'Portal')).toBeVisible();

    await expect(page.locator('main').getByRole('link', { name: /action/i }).locator('visible=true')).toBeVisible({ timeout: 3000 });
  });

  // Expected failure: a known bug a real browser can show. It starts failing the moment it's fixed.
  test('BUG-19: wheel-scrolling Recently Viewed logs no error', async ({ page }) => {
    test.fail();
    const logged: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') logged.push(message.text()); });
    await page.goto('/');
    await card(page, 'Portal').click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByTitle('Portal').hover();

    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(200);

    expect(logged.filter((text) => text.includes('preventDefault'))).toEqual([]);
  });
});

test.describe('at 375 px', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('the home page fits, and the menu opens and closes', async ({ page, context }) => {
    await rememberGenres(context);
    await page.goto('/');

    await expect(card(page, 'Portal')).toBeVisible();
    expect(await sidewaysOverflow(page)).toBe(0);
    const box = await card(page, 'Portal').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    // Portrait box art sits two to a row on a phone. Cards slide in one after another, so wait for them to settle.
    const tops = async () => {
      const [first, second] = await Promise.all([card(page, 'Portal').boundingBox(), card(page, 'Doom').boundingBox()]);
      return Math.round(second!.y - first!.y);
    };
    await expect.poll(tops).toBe(0);
    const next = await card(page, 'Doom').boundingBox();
    expect(next!.x).toBeGreaterThan(box!.x + box!.width);
    expect(box!.height).toBeGreaterThan(box!.width);

    await page.getByRole('button', { name: 'Toggle Menu' }).click();
    await expect(page.getByRole('link', { name: /action/i }).locator('visible=true')).toBeInViewport();

    // Its centre is under the drawer, so click the strip a user can actually reach.
    await page.getByRole('button', { name: 'Close mobile menu' }).click({ position: { x: 350, y: 400 } });
    await expect(page.getByRole('button', { name: 'Close mobile menu' })).toBeHidden();
  });

  test('the game modal fits', async ({ page }) => {
    await page.goto(`/?game=${portal.id}`);

    await expect(page.getByRole('heading', { name: 'Portal', level: 1 })).toBeVisible();
    const box = await page.locator('#game-modal-content').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });

  test('the collection page fits', async ({ page }) => {
    await page.goto('/collection');

    await expect(page.getByRole('heading', { name: 'My Collection', level: 1 })).toBeVisible();
    expect(await sidewaysOverflow(page)).toBe(0);
  });

  test('a phone user signs in from the menu (BUG-25, fixed)', async ({ page, outside }) => {
    await page.goto('/');
    await expect(card(page, 'Portal')).toBeVisible();

    await page.getByRole('button', { name: 'Toggle Menu' }).click();
    await expect(page.getByText('Sync your library')).toBeInViewport();
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByRole('button', { name: 'Close mobile menu' })).toBeHidden();
    await page.getByPlaceholder('Enter your email address').fill('player@gmail.com');
    await page.getByRole('button', { name: /Send Magic Link/ }).click();
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
    expect(outside.magicLinks).toHaveLength(1);
  });

  test('a signed-in phone user sees their email and signs out from the menu (BUG-25, fixed)', async ({ page, context, outside }) => {
    await signIn(context);
    await page.goto('/');

    await page.getByRole('button', { name: 'Toggle Menu' }).click();
    await expect(page.getByText('player@test.invalid')).toBeInViewport();
    await page.getByRole('button', { name: 'Sign Out' }).click();

    await expect(page.getByRole('button', { name: 'Close mobile menu' })).toBeHidden();
    await page.getByRole('button', { name: 'Toggle Menu' }).click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeInViewport();
    expect(outside.signOuts).toBe(1);
  });

  for (const width of [320, 360]) {
    test(`the header stays uncluttered on a ${width} px phone`, async ({ page, context }) => {
      await signIn(context);
      await page.setViewportSize({ width, height: 812 });
      await page.goto('/');

      const logo = (await page.getByRole('link', { name: /Nexus/ }).locator('visible=true').boundingBox())!;
      const search = (await page.getByRole('button', { name: 'Open Search' }).boundingBox())!;
      const menu = (await page.getByRole('button', { name: 'Toggle Menu' }).boundingBox())!;
      // The search icon's box has 8 px of padding around the glyph.
      expect(search.x + 8).toBeGreaterThan(logo.x + logo.width);
      expect(logo.x).toBeGreaterThan(menu.x + menu.width);
      await expect(page.getByRole('button', { name: 'User Menu' })).toBeHidden();
    });
  }
});

test.describe('offline, with the real service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('the app and saved games still load', async ({ page, context }) => {
    await page.goto('/');
    await card(page, 'Portal').hover();
    await card(page, 'Portal').getByRole('button', { name: 'Add to favorites' }).click();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });

    await context.setOffline(true);
    await page.goto('/collection');

    await expect(page.getByRole('heading', { name: 'My Collection', level: 1 })).toBeVisible();
    await expect(card(page, 'Portal')).toBeVisible();
  });

  test('games seen online still show offline', async ({ page, context, outside }) => {
    await page.goto('/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload(); // now the service worker handles the page, and keeps the answers it passes on
    await expect(card(page, 'Portal')).toBeVisible();
    const asked = outside.gameRequests.length;

    await context.setOffline(true);
    outside.offline = true;
    await page.reload();

    await expect(card(page, 'Doom')).toBeVisible();
    expect(outside.gameRequests.length).toBe(asked);
  });
});
