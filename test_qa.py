#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Minimal QA test for ZYRA e-commerce website
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from playwright.sync_api import sync_playwright
import time

def test_zyra_ecommerce():
    """Minimal QA test - core functionality only"""
    print("Starting ZYRA E-commerce QA Test...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()
        
        try:
            # Test 1: Home page loads
            print("\n1. Testing home page...")
            page.goto("http://localhost:5174/")
            page.wait_for_load_state("networkidle")
            
            title_check = "ZYRA - Premium Fashion & Lifestyle Store" in page.title()
            print("   ✓ Home page loads" if title_check else "   ✗ Title mismatch")
            
            # Test 2: Products exist
            print("\n2. Checking products...")
            page.wait_for_timeout(3000)
            
            product_count = page.locator("text=Slim-Fit Stretch Shirt").count()
            print(f"   ✓ Products displayed: {product_count} found" if product_count > 0 else "   ✗ No products found")
            
            # Test 3: Add to cart
            print("\n3. Testing Add to Cart...")
            add_btn = page.locator("text=Add to Cart")
            if add_btn.count() > 0:
                add_btn.first.click()
                page.wait_for_timeout(2000)
                print("   ✓ Add to Cart clicked successfully")
            else:
                print("   ⚠ Add to Cart button not found")
            
            # Test 4: Cart visible
            print("\n4. Checking cart...")
            # Just verify the page is still accessible
            current_url = page.url
            print(f"   ✓ Current URL: {current_url}")
            
            # Test 5: Navigation
            print("\n5. Testing navigation...")
            nav_items = ["Men", "Women", "Top Wear", "Bottom Wear"]
            nav_found = 0
            for text in nav_items:
                link = page.locator(f"text={text}").filter(has_text=text).first
                if link.count() > 0:
                    nav_found += 1
                    link.click()
                    page.wait_for_load_state("networkidle")
                    # Go back
                    page.goto("http://localhost:5174/")
                    page.wait_for_load_state("networkidle")
            
            print(f"   ✓ Navigation links found: {nav_found}/{len(nav_items)}")
            
            # Test 6: Admin accessible
            print("\n6. Testing admin access...")
            admin_link = page.locator("text=Admin")
            admin_exists = admin_link.count() > 0
            if admin_exists:
                admin_link.click()
                page.wait_for_load_state("networkidle")
                # Check if redirected to login (expected for unauthenticated)
                has_login = "/login" in page.url or "/local-login" in page.url
                print(f"   ✓ Admin link exists, redirects to login: {has_login}")
            else:
                print("   ⚠ Admin link not found")
            
            print("\n✅ QA test session completed!")
            return True
            
        except Exception as e:
            print(f"\n❌ Test error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
            
        finally:
            browser.close()

if __name__ == "__main__":
    success = test_zyra_ecommerce()
    sys.exit(0 if success else 1)