from bs4 import BeautifulSoup
import requests
import csv

# File to save brand and model data
BRAND_MODEL_FILE = 'brands_and_models.csv'

# Function to extract brands and models
def find_brand_model(soup):
    brands_and_models = {}
    soup_bm = soup.find_all('li', class_="menuparent")
    BaM = soup_bm[1:28]  # Adjust range as per bonbanh.com structure
    for brand in BaM:
        labels = [tag.text for tag in brand.find_all(['a', 'span'])]
        brands_and_models[labels[0]] = labels[1:]

    # Load from external file if applicable
    with open("Other brands and models.txt", 'r', encoding='utf-8') as txt:
        html_doc = txt.read()
    other_bams = BeautifulSoup(html_doc, 'html.parser')
    others = other_bams.find_all('li', class_='menuparent')
    others = others[1:]
    for item in others:
        other_labels = [other_tag.text for other_tag in item.find_all(['a', 'span'])]
        brands_and_models[other_labels[0]] = other_labels[1:]

    return brands_and_models

# Function to save brands and models to a CSV file
def save_brands_and_models(brands_and_models):
    print(f"Saving brands and models to {BRAND_MODEL_FILE}...")
    with open(BRAND_MODEL_FILE, 'w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(['Brand', 'Models'])  # Header row
        for brand, models in brands_and_models.items():
            models_str = ', '.join(models)  # Combine models into a single string
            writer.writerow([brand, models_str])
    print(f"Brands and models saved to {BRAND_MODEL_FILE}.")

# Function to fetch HTML content
def fetch_html(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.126 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    response.encoding = 'utf-8'
    if response.status_code == 200:
        return response.text
    else:
        print(f"Failed to fetch: {url} (Status code: {response.status_code})")
        return None

# Main function
def main():
    base_url = "https://bonbanh.com/oto"
    print("Fetching brand and model data...")
    html_text = fetch_html(base_url)
    if not html_text:
        print("Failed to fetch main page. Exiting...")
        return

    soup = BeautifulSoup(html_text, 'lxml')
    brands_and_models = find_brand_model(soup)
    save_brands_and_models(brands_and_models)

if __name__ == "__main__":
    main()