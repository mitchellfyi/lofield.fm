/**
 * JSON-LD Structured Data Components
 * For SEO-friendly schema.org markup
 */

interface WebsiteJsonLdProps {
  url: string;
  name: string;
  description: string;
}

export function WebsiteJsonLd({ url, name, description }: WebsiteJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface SoftwareApplicationJsonLdProps {
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
}

export function SoftwareApplicationJsonLd({
  name,
  description,
  url,
  applicationCategory,
  operatingSystem,
}: SoftwareApplicationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory,
    operatingSystem,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface MusicRecordingJsonLdProps {
  name: string;
  url: string;
  genre?: string;
  duration?: string; // ISO 8601 duration format
}

export function MusicRecordingJsonLd({ name, url, genre, duration }: MusicRecordingJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name,
    url,
    ...(genre && { genre }),
    ...(duration && { duration }),
    creator: {
      "@type": "Organization",
      name: "LoField Music Lab",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
