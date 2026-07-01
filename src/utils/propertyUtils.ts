export const DEFAULT_PROPERTY_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=";

/**
 * Robustly retrieves the main image URL for a property.
 * Handles:
 * - New images relation (array of objects with url/image_url)
 * - Legacy image_url field (Base64 string, JSON array, or plain string)
 * - Returns a fallback image if no image is found.
 */
export function getPropertyImage(property: any, fallback: string = DEFAULT_PROPERTY_IMAGE): string {
    if (!property) return fallback;

    // 1. Priority: images relation (new table)
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        const main = property.images.find((img: any) => img.is_main) || property.images[0];
        const url = main.url || main.image_url;
        if (url) return url;
    }

    // 2. Fallback: image_url field
    if (property.image_url) {
        // If it's already an array
        if (Array.isArray(property.image_url) && property.image_url.length > 0) {
            return property.image_url[0];
        }

        // If it's a string, try parsing it as JSON (in case it's a JSON stringified array)
        if (typeof property.image_url === 'string') {
            const trimmed = property.image_url.trim();
            if (trimmed === '') return fallback;

            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed[0];
                }
            } catch {
                // If parsing fails, it might be a Base64 string or a direct URL
                return trimmed;
            }
        }
    }

    return fallback;
}

/**
 * Robustly retrieves all image URLs for a property.
 */
export function getPropertyImages(property: any, fallback: string = DEFAULT_PROPERTY_IMAGE): string[] {
    if (!property) return [fallback];

    const images: string[] = [];

    // 1. images relation
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
        property.images.forEach((img: any) => {
            const url = img.url || img.image_url;
            if (url) images.push(url);
        });
    }

    // 2. image_url field fallback
    if (images.length === 0 && property.image_url) {
        if (Array.isArray(property.image_url)) {
            property.image_url.forEach((url: any) => {
                if (typeof url === 'string') images.push(url);
            });
        } else if (typeof property.image_url === 'string') {
            const trimmed = property.image_url.trim();
            if (trimmed !== '') {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        parsed.forEach((url: any) => {
                            if (typeof url === 'string') images.push(url);
                        });
                    } else {
                        images.push(trimmed);
                    }
                } catch {
                    images.push(trimmed);
                }
            }
        }
    }

    return images.length > 0 ? images : [fallback];
}
