import { createSutairu } from '@sutairu/core';
import { describe, expect, test } from 'vitest';

describe('Serialization', () => {
  const sheet = createSutairu();
  const { css, getCssText, toString, createTheme } = sheet;

  const myComponent = css({
    all: 'unset',
    font: 'inherit',
    margin: 0,
    padding: '0.5em 1em',
  });
  const myComponentClassName = 'c-cLikna';

  const myTheme = createTheme({
    colors: {
      blue: 'dodgerblue',
    },
  });
  const myThemeClassName = 't-jPkpUS';

  test('Components implicitly return their class name', () => {
    expect(String(myComponent)).toBe(myComponentClassName);
    // biome-ignore lint/style/useTemplate: <explanation>
    expect('' + myComponent).toBe(myComponentClassName);
    expect(`${myComponent}`).toBe(myComponentClassName);
  });

  test('Themes implicitly return their class name', () => {
    expect(String(myTheme)).toBe(myThemeClassName);
    // biome-ignore lint/style/useTemplate: <explanation>
    expect('' + myTheme).toBe(myThemeClassName);
    expect(`${myTheme}`).toBe(myThemeClassName);
  });

  test('Components can explicitly return their class name', () => {
    expect(myComponent.className).toBe(myComponentClassName);
    expect(myComponent.toString()).toBe(myComponentClassName);
  });

  test('Themes can explicitly return their class name', () => {
    expect(myTheme.className).toBe(myThemeClassName);
    expect(myTheme.toString()).toBe(myThemeClassName);
  });

  test('Components and themes can explicitly return their selector', () => {
    expect(myComponent.selector).toBe(`.${myComponentClassName}`);
    expect(myTheme.selector).toBe(`.${myThemeClassName}`);
  });

  const sheetCssText = `--sxs{--sxs:0 t-jPkpUS}@layer themed{.${myThemeClassName}{--colors-blue:dodgerblue}}--sxs{--sxs:2 c-cLikna}@layer styled{.${myComponentClassName}{all:unset;font:inherit;margin:0;padding:0.5em 1em}}`;

  test('Sheets implicitly return their cssText', () => {
    expect(String(sheet)).toBe(sheetCssText);
    // biome-ignore lint/style/useTemplate: <explanation>
    expect('' + sheet).toBe(sheetCssText);
    expect(`${sheet}`).toBe(sheetCssText);
  });

  test('Sheets can explicitly return their cssText', () => {
    expect(getCssText()).toBe(sheetCssText);
    expect(toString()).toBe(sheetCssText);
  });
});