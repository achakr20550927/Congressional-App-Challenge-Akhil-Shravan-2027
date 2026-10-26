import { expect } from '@playwright/test';
export async function onboard(page){
  await page.goto('/consent');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/continue/i}).click();
  await page.locator('#displayName').fill('Test participant');
  await page.getByRole('button',{name:/continue/i}).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading',{name:'Welcome back, Test.'})).toBeVisible();
}
export async function seed(page){
  return page.evaluate(async()=>{
    const {saveTaskResult}=await import('/src/lib/storage.js');
    const {sampleResult}=await import('/src/screens/Recording.jsx');
    return saveTaskResult({...sampleResult(),notes:'Reference note for export.'});
  });
}
export async function noOverflow(page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
