import { test,expect } from '@playwright/test';
import { onboard } from './helpers.js';
import { fileURLToPath } from 'node:url';
test.beforeEach(async({page},info)=>{
  test.skip(!['chromium','mobile'].includes(info.project.name),'Deterministic camera harness runs in Chromium desktop/mobile; real-device validation is separate.');
  await page.route('**/src/lib/capture.js',r=>r.fulfill({path:fileURLToPath(new URL('./camera-fixture.js',import.meta.url)),contentType:'application/javascript'}));
  await onboard(page);
});
for(const task of ['rest','postural','tap','pronation'])test(`camera ${task}: capture → quality → save → stop tracks`,async({page})=>{
  await page.goto(`/capture/${task}`);await page.getByRole('button',{name:'Enable camera'}).click();
  await expect(page.getByRole('button',{name:'Start 10-second check-in'})).toBeEnabled();
  await page.getByRole('button',{name:'Start 10-second check-in'}).click();await expect(page.locator('.result-view')).toBeVisible({timeout:20000});
  await expect(page.locator('.finding-card')).toContainText('RECORDED');
  expect(await page.evaluate(()=>window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true);
  const count=await page.evaluate(async()=>{const {getSessionHistory}=await import('/src/lib/storage.js');return (await getSessionHistory()).length;});expect(count).toBe(1);
});
test('permission denial, missing hand, cancellation and task-switch cleanup',async({page})=>{
  await page.goto('/capture/rest');await page.evaluate(()=>window.__fixture='denied');await page.getByRole('button',{name:'Enable camera'}).click();await expect(page.getByRole('alert')).toContainText('permission was denied');
  await page.evaluate(()=>window.__fixture='missing');await page.getByRole('button',{name:'Enable camera'}).click();await expect(page.getByText('HAND NOT VISIBLE',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Start 10-second check-in'})).toBeDisabled();
  await page.evaluate(()=>window.__fixture='normal');await expect(page.getByRole('button',{name:'Start 10-second check-in'})).toBeEnabled();await page.getByRole('button',{name:'Start 10-second check-in'}).click();await page.getByRole('button',{name:'Cancel check-in'}).click();
  expect(await page.evaluate(()=>window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true);
  await page.getByRole('button',{name:'Enable camera'}).click();await expect(page.getByRole('button',{name:'Start 10-second check-in'})).toBeEnabled();
  await page.getByRole('link',{name:'ALL CHECK-INS',exact:false}).click();await expect(page).toHaveURL(/\/app$/);await expect.poll(()=>page.evaluate(()=>window.__streams.every(s=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true);
});
