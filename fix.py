with open('c:/Users/parin/Desktop/EarningLens/frontend/src/pages/LandingPage.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace(r'\`', '`').replace(r'\${', '${')
with open('c:/Users/parin/Desktop/EarningLens/frontend/src/pages/LandingPage.jsx', 'w', encoding='utf-8') as f:
    f.write(c)
