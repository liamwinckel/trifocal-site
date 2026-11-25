# Trifocal Media site: going live

Every page from the Squarespace site is here, in the same structure and at the same addresses
(/services, /production, /our-work/commercial, /company, /careers, /consultation, /contact, /blog, …).

## 1. Save the photos and videos (before cancelling Squarespace)
Photos and videos still load from Squarespace's servers. Open Terminal in this folder and run:

    bash fetch-assets.sh

That downloads every photo into assets/img/ and updates the pages to use them.
For the videos, install ffmpeg first (`brew install ffmpeg`) and the same script saves them to assets/video/.
If a video won't save, export it from your own project and name it <id>.mp4 (the id is in the page's
`data-sq="…"`). Keep each file under 100 MB (GitHub's limit); 1080p H.264 is ideal.

## 2. Put it on GitHub Pages
1. Create a repo (e.g. trifocal-site) and upload everything in this folder.
2. Settings → Pages → Deploy from a branch → main → / (root).
3. The CNAME file already says www.trifocalmedia.com.

## 3. Point the domain (in Squarespace → Domains → trifocalmedia.com → DNS)
- Delete the Squarespace Defaults records for the website only (A records and the www CNAME). Leave anything for email (MX, TXT) alone.
- Add CNAME:  www → <your-github-username>.github.io
- Add A records for @: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- Back in GitHub Pages settings, tick "Enforce HTTPS" once it's available.

## 4. Forms
The Contact and Careers forms open the visitor's email app until you connect a form service.
For submissions straight to your inbox: create two free forms at formspree.io and paste their URLs into
FORM_ENDPOINTS at the top of assets/site.js.
The Consultation page uses the same TidyCal booking embed as before (tfm/consultation).

## 5. Fonts
Body text is Poppins (Google Fonts, free). Headings on Squarespace use Acumin Pro, an Adobe font licensed
through Squarespace. Until you add an Adobe Fonts web project for trifocalmedia.com, headings fall back to Archivo.
To add it: paste the Adobe Fonts <link> tag where it says <!-- ADOBE_FONTS --> in each page (or ask Claude to do it).

## 6. Blog posts
The blog page lists all 16 posts, but the posts themselves haven't been moved yet. Their Read More links
will break once the domain points here, so move the posts first.

## 7. Then cancel the Squarespace website plan
Keep the domain renewed.
