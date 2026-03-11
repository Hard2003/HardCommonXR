# TCXR Takehome for perspective FS Interns

## Installation
The following repository is an example React project. Install the project by downloading the project and using the following:
> npm install
run the react project project by using
> npm start
A simplified implementation of a backend was implemented in the backend folder. Start up the python server using 
> cd backend
> python server.py

This project was created using CRA, react-router-dom for the Frontend and Express for the backend. 
No other external libraries are needed to complete this task. However if another package is needed, please explain what it is and why you need it in a separate md file named `PACKAGEPROPOSAL.md` 

## Overview
The aim of your task is to display a number of different pages for an administrator of a pre-school chain, **TCXR Cares**. We will be skipping all of the login pages and assume that this is an internal site accessible from within the TCXR Network only.

We ask you to take no more than 2 hours on the test and to self report how long you worked on it. If you are struggling on anything do ask.

## Tasks
1. display all the students in a table in the page `api/students`
2. display all the institutions in a table in the page `api/institutions`
3. I want to reduce the number of times our api is requested for data when we have already done so previously. Implementa solution that would only call for data again when the page is refreshed but redisplays previously retrieved data when going back between the `students` and `institutions` pages
    - data should not be stored in insecure locations (admin’s local computer)
4. display all students belonging to an institution 
    - these pages should be accessible from the `institution` page and not the nav bar
    - the api endpoint for this feature `/api/institution/studentRoster` is incomplete, please complete it in the backend folder
    - going back to the institution page should not make a second api call
5. display a dashboard for the admin and teacher using the the data from 
    - please use [plotly.js](https://plotly.com/javascript/) to create the graphs for the dashboard
    - As an administrator, what would you like to see on your dashboard and why?
    - what if you were a teacher?