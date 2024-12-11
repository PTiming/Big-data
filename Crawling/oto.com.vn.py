import requests
from bs4 import BeautifulSoup
import csv
import time
import re

def normalize_text(text):
    return re.sub(r"[\s\-]+", "", text.lower())

# Function to fetch HTML content using requests
def fetch_html(url):
    """
    Fetch HTML content from a URL with proper headers for avoiding blocks.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    return response.text if response.status_code == 200 else None

def load_brands_and_models(file_path):
    """
    Load car brands and their models from a CSV file.
    """
    brands_and_models = {}
    with open(file_path, "r", encoding="utf-8") as file:
        reader = csv.reader(file)
        for row in reader:
            if len(row) >= 2:
                brand = row[0].strip()
                models = [model.strip() for model in row[1].strip('"').split(",")]
                brands_and_models[brand] = models
    return brands_and_models

def extract_brand_model(car_name, brands_and_models):
    """
    Extract the car's brand and model based on the car name, with support for
    spaces, hyphens, and prioritizing specific brands.
    """
    normalized_car_name = normalize_text(car_name)

    for brand, models in brands_and_models.items():
        normalized_brand = normalize_text(brand)

        # Check if the normalized brand matches
        if normalized_brand in normalized_car_name:
            # Prioritize specific brands
            if brand.lower() == "land rover" and "landrover" in normalized_car_name:
                for model in models:
                    normalized_model = normalize_text(model)
                    if normalized_model in normalized_car_name:
                        return brand, model
                return brand, "Khác"

            # Match models under the brand
            for model in models:
                normalized_model = normalize_text(model)
                if normalized_model in normalized_car_name:
                    return brand, model

            # Brand matches, but no specific model found
            return brand, "Khác"

    # No matches found
    return "Không xác định", "Không xác định"

# Function to parse entries on the main page
def parse_entries(html, page_number):
    soup = BeautifulSoup(html, "html.parser")
    main_div = soup.select_one("div#box-list-car")

    if not main_div:
        print(f"Page {page_number}: Main div not found.")
        return []

    entries = main_div.find_all("div", class_="item-car")
    results = []
    for entry in entries:
        # Extract relevant details
        title_tag = entry.find("h3", class_="title")
        title = title_tag.get_text(strip=True) if title_tag else "N/A"
        price_tag = entry.find("p", class_="price")
        price = price_tag.get_text(strip=True) if price_tag else "N/A"
        link_tag = title_tag.find("a") if title_tag else None
        link = link_tag["href"] if link_tag else "N/A"
        results.append({"title": title, "price": price, "link": link})
    return results

# Function to parse the details page
def parse_details_page(details_url, brands_and_models):
    """
    Extract details of a car, including its name, brand, and model.
    """
    html = fetch_html(details_url)
    if not html:
        return {}

    soup = BeautifulSoup(html, "html.parser")
    details = {}

    # Extract car name
    h1_tag = soup.select_one("h1.title-detail")
    car_name = h1_tag.get_text(strip=True) if h1_tag else "N/A"

    # Determine brand and model
    brand, model = extract_brand_model(car_name, brands_and_models)
    details["Tên xe"] = car_name
    details["Thương hiệu"] = brand
    details["Model"] = model

    # Extract additional details
    ul_info = soup.select_one("ul.list-info")
    if ul_info:
        for li in ul_info.find_all("li"):
            label_tag = li.find("label", class_="label")
            label = label_tag.get_text(strip=True) if label_tag else "N/A"
            value = li.get_text(strip=True).replace(label, "").strip()
            details[label] = value

    return details


def main():
    base_url = ["https://oto.com.vn/mua-ban-xe/p@", "https://oto.com.vn/mua-ban-xe-moi/p@"]
    all_results = []

    # Load brand and model mapping
    brands_and_models = load_brands_and_models("brands_and_models.csv")

    # Loop through pages
    for i in base_url:
        for page in range(1, 6):  # Adjust range as needed
            url = i.replace("@", str(page))
            html = fetch_html(url)
            if not html:
                continue

            # Parse entries on the page
            soup = BeautifulSoup(html, "html.parser")
            entries = soup.select("div.item-car")
            for entry in entries:
                title_tag = entry.select_one("h3.title a")
                link = title_tag["href"] if title_tag else None
                price_tag = entry.select_one("p.price")
                price = price_tag.get_text(strip=True) if price_tag else "N/A"

                # Fetch car details
                details = parse_details_page(f"https://oto.com.vn{link}", brands_and_models) if link else {}
                details["Giá"] = price
                all_results.append(details)

                time.sleep(1)  # Delay to avoid overloading the server

    # Save results to CSV
# Save results to CSV
    with open("car_details.csv", "w", newline="", encoding="utf-8") as file:
        fieldnames = list(all_results[0].keys())
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_results)

    print("All results saved to car_details.csv.")


if __name__ == "__main__":
    main()