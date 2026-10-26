import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { onboard,seed,noOverflow } from './helpers.js';

test('fresh onboarding, return visit, view choice, settings and deletion',async({page})=>{
  await onboard(page);await noOverflow(page);
  await page.getByRole('button',{name:'Review',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Assessment overview.'})).toBeVisible();
  await page.reload();await expect(page.getByRole('button',{name:'Review',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.goto('/');await expect(page).toHaveURL(/\/app$/);
  await seed(page);await page.goto('/settings');
  await page.getByRole('button',{name:/clear all local data/i}).click();
  await page.getByRole('button',{name:/yes.*clear|delete everything|clear everything|confirm/i}).click();
  await expect(page).toHaveURL(/\/consent$/);
  await page.goto('/history');await expect(page).toHaveURL(/\/consent$/);
});

test('recording persistence, notes, review evidence, JSON and CSV exports',async({page})=>{
  await onboard(page);const r=await seed(page);await page.goto(`/results/${r.id}`);
  await expect(page.getByRole('heading',{name:'A repeating rhythm stood out.'})).toBeVisible();
  await page.getByRole('tab',{name:'Signal evidence'}).click();await expect(page.getByText('Recording integrity',{exact:true})).toBeVisible();
  await page.getByRole('tab',{name:'Context & notes'}).click();await page.getByLabel('Your notes',{exact:true}).fill('Café after exercise. Same setup.');
  await page.getByRole('button',{name:'Save notes',exact:true}).click();await expect(page.getByRole('status')).toContainText('Saved on this device');
  await page.reload();await page.getByRole('tab',{name:'Context & notes'}).click();await expect(page.getByLabel('Your notes',{exact:true})).toHaveValue('Café after exercise. Same setup.');
  const json=page.waitForEvent('download');await page.getByRole('button',{name:'Export data'}).click();expect((await json).suggestedFilename()).toMatch(/\.json$/);
  await page.goto('/history');await page.getByLabel('Task',{exact:true}).selectOption('rest');await page.getByLabel('Hand',{exact:true}).selectOption('Right');await expect(page.locator('.recording-row')).toHaveCount(1);
  const csv=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV'}).click();expect((await csv).suggestedFilename()).toMatch(/\.csv$/);
  await noOverflow(page);
});

test('reports empty state, generation, selection invalidation and download',async({page},info)=>{
  await onboard(page);await page.goto('/export');await expect(page.getByText('No recordings yet.',{exact:false})).toBeVisible();
  await seed(page);await page.reload();await page.getByRole('button',{name:/generate pdf/i}).click();
  await expect(page.getByRole('button',{name:'Download',exact:true})).toBeVisible();
  await page.locator('#note').fill('Discuss changes in context.');await expect(page.getByRole('button',{name:/generate pdf/i})).toBeVisible();
  await page.getByRole('button',{name:/generate pdf/i}).click();const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download',exact:true}).click();const file=await event;await file.saveAs(info.outputPath('recording-report.pdf'));
  expect((await file.failure())).toBeNull();
});

test('drawing completes, survives reload, repeated attempt rejects incomplete trace',async({page})=>{
  await onboard(page);await page.goto('/capture/spiral');await page.getByRole('button',{name:'Start 30-second check-in'}).click();
  const box=await page.locator('.spiral-pad').boundingBox();const radius=Math.min(box.width,box.height)*.41;
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();
  for(let i=1;i<=120;i++){const theta=i/120*8*Math.PI,r=radius*i/120;await page.mouse.move(x+r*Math.cos(theta),y+r*Math.sin(theta));await page.waitForTimeout(18);}
  await page.mouse.up();await expect(page.getByRole('heading',{name:'Your trace, measured.'})).toBeVisible();
  await page.getByRole('button',{name:'Repeat this task'}).click();await page.getByRole('button',{name:'Start 30-second check-in'}).click();
  const repeatBox=await page.locator('.spiral-pad').boundingBox();const rx=repeatBox.x+repeatBox.width/2,ry=repeatBox.y+repeatBox.height/2;
  await page.mouse.move(rx,ry);await page.mouse.down();await page.mouse.move(rx+10,ry+10);await page.mouse.up();
  await expect(page.getByRole('heading',{name:'Let’s get a clearer recording.'})).toBeVisible();
  await page.goto('/history');await page.getByLabel('Task',{exact:true}).selectOption('spiral');await expect(page.locator('.recording-row')).toHaveCount(2);
});

test('public screens, keyboard navigation, accessible names and mobile layout',async({page})=>{
  for(const path of ['/demo','/evidence','/welcome','/consent']){
    await page.goto(path);await page.locator('h1').first().waitFor();await noOverflow(page);
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
    expect(scan.violations.filter(v=>v.impact==='critical'||v.impact==='serious').map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
  await page.goto('/demo');await page.getByRole('tab',{name:'Signal evidence'}).focus();await page.keyboard.press('Enter');await expect(page.getByText('Recording integrity',{exact:true})).toBeVisible();
});

test('workspace screens have accessible controls and responsive layouts',async({page})=>{
  await onboard(page);await seed(page);
  for(const path of ['/app','/history','/export','/settings','/capture/rest','/capture/spiral']){
    await page.goto(path);await page.locator('h1').waitFor();await noOverflow(page);
    const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();
    expect(scan.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
  }
});

test('desktop phone preview uses the mobile layout and retains analysis',async({page},info)=>{
  test.skip(info.project.name==='mobile','Phone layout already exercised at mobile viewport.');
  await page.goto('/demo?preview=phone');await page.locator('.finding-card').waitFor();
  expect((await page.locator('.app-frame').boundingBox()).width).toBeLessThanOrEqual(430);
  await expect(page.getByRole('navigation',{name:'Mobile navigation'})).toBeVisible();
  await page.getByRole('tab',{name:'Signal evidence'}).click();
  await expect(page.getByText('Recording integrity',{exact:true})).toBeVisible();
  expect(await page.locator('.app-frame').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  await page.getByRole('button',{name:'Exit phone preview'}).click();
  expect((await page.locator('.app-frame').boundingBox()).width).toBeGreaterThan(640);
  await onboard(page);await page.goto('/app?preview=phone');
  await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Journal'}).click();
  await expect(page.locator('.phone-preview')).toBeVisible();
});

test('production offline shell and lazy routes work after first load',async({page,context,browserName})=>{
  await page.goto('http://127.0.0.1:4193/demo');await page.getByRole('heading',{name:'Resting hand',exact:true}).waitFor();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.goto('http://127.0.0.1:4193/evidence');await expect(page.getByRole('heading',{name:'Transparency is a feature.'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'A stronger research baseline.'})).toBeVisible();
  await page.goto('http://127.0.0.1:4193/demo');await expect(page.getByRole('heading',{name:'A repeating rhythm stood out.'})).toBeVisible();
  await context.setOffline(false);
});
