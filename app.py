import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import Field,BaseModel,StrictBool
import pandas as pd
import numpy as np
from typing import Literal

app=FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)
model=joblib.load('grad_boost.pkl')
class aids_salary_data(BaseModel):

    job_title:Literal['Data Analyst', 'Research Scientist', 'Machine Learning Engineer',
                      'Data Engineer', 'Analytics Engineer',
                      'Business Intelligence Analyst', 'Data Science Manager',
                      'Computer Vision Engineer', 'LLM Engineer', 'Data Scientist',
                      'AI Engineer', 'MLOps Engineer']
    experience_level:Literal['Lead', 'Senior', 'Entry', 'Mid', 'Executive']
    employment_type:Literal['Part-time', 'Full-time', 'Contract', 'Freelance']
    company_size:Literal['S', 'L', 'M']
    company_location:Literal['IN', 'US', 'BR', 'SG', 'AU', 'GB', 'FR', 'DE', 'PL', 'NL', 'CA',
                            'ES']
    employee_residence:Literal['AU', 'US', 'IN', 'SG', 'GB', 'DE', 'FR', 'PL', 'NL', 'BR', 'CA',
                              'ES']
    industry:Literal['Finance', 'Retail', 'Government', 'Education', 'Technology',
                     'Healthcare', 'Consulting', 'Media', 'Manufacturing', 'Energy']
    years_experience:int=Field(...,ge=0,le=24)
    education_level:Literal['Bachelors', 'Masters', 'Bootcamp', 'Self-taught', 'PhD']
    primary_language:Literal['Python', 'SQL', 'Java', 'R', 'Julia', 'Scala', 'Rust']
    has_ml_in_title:StrictBool
    manages_people:StrictBool
    certifications_count:int=Field(...,ge=0,le=9)
    weekly_hours:int=Field(...,ge=24,le=67)
    uses_ai_tools_daily:StrictBool
    salary_currency:Literal['INR', 'USD', 'BRL', 'SGD', 'AUD', 'GBP', 'EUR', 'PLN', 'CAD']
    equity_offered_pct:float=Field(...,ge=0,le=1.3)
    bonus_pct:int=Field(...,ge=0,le=30)
    job_satisfaction_score:float=Field(...,ge=1.1,le=24)
    interviews_to_offer:int=Field(...,ge=1,le=16)
    switched_jobs_last_year:StrictBool
    fears_ai_automation_score:int=Field(...,ge=1,le=10)

class prediction_response(BaseModel):
      salary_usd:float

@app.get('/')
def greet():
    return {"message" : "welcome to AI and DS salary Prediction platform"}

@app.post('/predict')
def predict(data:aids_salary_data):

    input_df=pd.DataFrame([
        {
            'job_title':data.job_title,
            'experience_level':data.experience_level,
            'employment_type':data.employment_type,
            'company_size':data.company_size,
            'company_location':data.company_location,
            'employee_residence':data.employee_residence,
            'industry':data.industry,
            'years_experience':data.years_experience,
            'education_level':data.education_level,
            'primary_language':data.primary_language,
            'has_ml_in_title':data.has_ml_in_title,
            'manages_people':data.manages_people,
            'certifications_count':data.certifications_count,
            'weekly_hours':data.weekly_hours,
            'uses_ai_tools_daily':data.uses_ai_tools_daily,
            'salary_currency':data.salary_currency,
            'equity_offered_pct':data.equity_offered_pct,
            'bonus_pct':data.bonus_pct,
            'job_satisfaction_score':data.job_satisfaction_score,
            'interviews_to_offer':data.interviews_to_offer,
            'switched_jobs_last_year':data.switched_jobs_last_year,
            'fears_ai_automation_score':data.fears_ai_automation_score
        }
    ])

    prediction=model.predict(input_df)[0]
    return prediction_response(salary_usd=prediction)
