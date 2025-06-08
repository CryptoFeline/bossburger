# BossBurger PFP Editor

![Bossburger Logo](./public/BossBurger.svg)

A simple, mobile-friendly React app for overlaying images on uploaded images. Designed to be embedded as a transparent widget (iframe-ready) on any website.

## Features

- **Upload your PFP image** (PNG or JPG)
- **Add "OG Eyes" or "New Eyes" overlays** with one tap
- **Drag, scale, and rotate** the overlay with mouse/touch
- **Flip or delete** the overlay easily
- **Save your creation** as a PNG (with BossBurger watermark)
- **Responsive design**: works great on desktop, tablet, and mobile
- **No background**: transparent everywhere for seamless embedding

## How to Use

1. **Upload your PFP image** using the "Upload Image" button.
2. **Add eyes** by tapping "OG Eyes" or "New Eyes".
3. **Move, scale, or rotate** the overlay using the handles.
4. **Flip** the overlay or **delete** it with the corner buttons.
5. **Save** your finished new PFP with the "Save Image" button.
6. **Start over** with "New Image".

## Tech Stack

- React (TypeScript)
- HTML5 Canvas for image editing
- Fully inline/CSS-in-JS styling, no external CSS dependencies

## Project Structure

```
bossburger/
├── public/
│   ├── index.html
│   ├── newEyes.png
│   ├── originalEyes.png
│   └── BossBurger.svg
├── src/
│   ├── components/
│   │   ├── CanvasEditor.tsx
│   │   ├── Controls.tsx
│   │   └── Watermark.tsx
│   ├── App.tsx
│   ├── index.tsx
│   └── types/
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT

---

**Made for BossBurger.fun**
