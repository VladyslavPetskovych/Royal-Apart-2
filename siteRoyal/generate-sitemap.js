import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";
import path from "path";

const sitemap = new SitemapStream({
  hostname: "https://royalapart.online",
});

const pages = [
  { url: "/", changefreq: "daily", priority: 0.9 },
  { url: "/aparts", changefreq: "daily", priority: 0.8 },
  { url: "/book", changefreq: "daily", priority: 0.8 },
  { url: "/contact", changefreq: "daily", priority: 0.6 },
  { url: "/service", changefreq: "daily", priority: 0.4 },
  { url: "/rules", changefreq: "daily", priority: 0.8 },
  { url: "/about-us", changefreq: "daily", priority: 0.8 },
  // Add other important pages of your site
];

pages.forEach((page) => sitemap.write(page));

sitemap.end();

streamToPromise(sitemap)
  .then((data) =>
    createWriteStream(path.join("./", "public", "sitemap.xml")).write(data)
  )
  .catch((err) => console.error(err));
