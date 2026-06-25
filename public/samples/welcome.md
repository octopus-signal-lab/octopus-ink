# MD Viewer

A small, fast reader for your local markdown — built to match the **Canvas Tool** aesthetic.

## Two lenses

Flip between the rendered **Visual** view and the **Raw** source using the pill in the top bar, or hit `Tab`.

> Same file, two ways of looking at it. Judgment stays yours.

### Features

- Open a whole **folder** and browse every `.md` file in a sidebar
- Drag files in from anywhere
- Filter the list as you type
- `⌘O` to open, `j` / `k` to move between files

### Code blocks render too

```js
function render(md) {
  return marked.parse(md);
}
```

| Lens   | Shows            |
|--------|------------------|
| Visual | rendered HTML    |
| Raw    | the source text  |

- [x] Open folder
- [x] Toggle views
- [ ] Read everything

That's it. Open your build folder and start reading.
