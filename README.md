# **Volt**  



## **Tech Stack**  
### **Frontend**  
- **Nextjs** + **Tailwind CSS** for the user interface.  

### **Backend**  
- **Django** (Python) for RESTful APIs.  
- **PostgreSQL** for database management.  


### **Authentication**  
- **JWT (JSON Web Tokens)** for secure session management.  

---

## **Installation**  
Follow these steps to set up the project locally:  

### **1. Clone the Repository**  
```bash
git clone https://github.com/codeAKstan/Volt.git
cd Volt
```

### **2. Frontend setup**
### **- Navigate to the frontend folder:**
```bash
cd frontend
```
### **- Install dependencies:**
```bash
npm install
```
### **- Start the development server:**
```bash
npm run dev
```

### **3. Backend Setup**

### **- Navigate to the backend folder:**
```bash
cd ../backend/
```

### **- Create a virtual environment and activate it:**
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
venv\Scripts\activate     # On Windows
```
### **- Install dependencies:**
```bash
pip install -r requirements.txt
```

### **4. Setup the database**
    Create a mysql database named volt_db.

    Update the database settings in settings.py.

### **5. Run migration:**
```bash
python manage.py migrate
```

### **6. Start the development server:**
```
python manage.py runserver
```
