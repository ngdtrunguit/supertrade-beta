import requests

def test_price_api():
    # Test BTC price
    response = requests.get("http://localhost:8000/get_price/BTC")
    print("BTC Price Response:", response.json())
    
    # Test ETH price
    response = requests.get("http://localhost:8000/get_price/ETH")
    print("ETH Price Response:", response.json())
    
    # Test invalid symbol
    try:
        response = requests.get("http://localhost:8000/get_price/INVALIDCOIN")
        print("Invalid Coin Response:", response.json())
    except:
        print("Invalid coin test passed (error received as expected)")
    
if __name__ == "__main__":
    print("Testing the API endpoints...")
    test_price_api()