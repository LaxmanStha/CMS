#include<iostream>
#include<fstream>
#include <vector>
#include <string>
#include <iomanip>
#include <algorithm>

using namespace std;

class Student{
    public:
        string name;
        int roll;
        string email;
        string course;
        int semester;


        void SetDetails(){
            cout << "Enter the name of Student:\t";
            getline(cin, name);
            cout << "\nEnter the roll number:\t";
            cin >> roll;
            cin.ignore(); 
            cout << "\nEnter the email:\t";
            getline(cin, email);
            cout << "\nEnter the course:\t";
            getline(cin, course);
            cout << "\nEnter the semester:\t";
            cin >> semester;
            cin.ignore(); 
        }
};

class Employee{
    public:
        string name;
        int id;
        int salary;
        string position;
        

        void SetDetails(){
            cout << "Enter the name of Employee:\t";
            getline(cin, name);
            cout << "\nEnter the ID:\t";
            cin >> id;
            cin.ignore(); 
            cout << "\nEnter the salary:\t";
            cin >> salary;
            cin.ignore(); //
            cout << "\nEnter the position:\t";
            getline(cin, position);
        }

      
};

class Teacher : public Employee{
    public:
        string subject;

        void SetDetails(){
            Employee::SetDetails();
            cout << "\nEnter the subject:\t";
            getline(cin, subject);
        }

};


void AddStudent(){
    Student s1;
    s1.SetDetails();
    fstream Studentfile("Student.txt",ios::app);
    Studentfile << "Name: " << s1.name
         << "\tRoll: " << s1.roll
         << "\t Email: " << s1.email
         << "\tCourse: " << s1.course
         << "\tSemester: " << s1.semester << endl;
}

void AddEmployee(){
    Employee e1;
    e1.SetDetails();
    fstream Employeefile("Employee.txt",ios::app);
    Employeefile << "Name: " << e1.name
         << "\tID: " << e1.id
         << "\tSalary: " << e1.salary
         << "\tPosition: " << e1.position<< endl;
}

void AddTeacher(){
    Teacher t1;
    t1.SetDetails();
    fstream Teacherfile("Teacher.txt",ios::app);
    Teacherfile << "Name: " << t1.name
         << "\tID: " << t1.id
         << "\tSalary: " << t1.salary
         << "\tPosition: " << t1.position
         << "\tSubject: " << t1.subject << endl;
}

// ===== HELPER STRUCT FOR STORING TIMETABLE DATA =====
// This struct stores all the data for one generated timetable
// so we can display/save multiple timetables easily
struct TimeTableData {
    string sectionName;
    vector<vector<string>> tName;      // Teacher names for each day/period
    vector<vector<string>> tSub;       // Subject names for each day/period
    vector<int> teacherLoads;          // Total periods assigned to each teacher
    vector<string> teacherNames;       // Names of all teachers
    int periodsPerDay;
};

// ===== GENERATE A SINGLE TIMETABLE =====
// WHY: By separating generation logic, we can call it multiple times
// This makes the code reusable and easier to maintain
TimeTableData GenerateSingleTimeTable(){
    struct Teacher {
        string name;
        string subject; // this single section's subject
        int load = 0;   // whole week load
    };

    const int days = 5;
    vector<string> dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri"};

    string sectionName;
    int periodsPerDay, numTeachers;

    cout << "\nEnter section name: ";
    cin >> sectionName;

    cout << "Enter number of periods per day: ";
    cin >> periodsPerDay;

    cout << "Enter number of teachers: ";
    cin >> numTeachers;

    vector<Teacher> teachers(numTeachers);

    for (int i = 0; i < numTeachers; i++) {
        cout << "\n--- Teacher " << (i + 1) << " ---\n";
        cout << "Teacher name: ";
        cin >> teachers[i].name;

        cout << "Subject: ";
        cin >> teachers[i].subject;
    }

    // timetable[day][period]
    vector<vector<string>> tName(days, vector<string>(periodsPerDay, "Free"));
    vector<vector<string>> tSub(days, vector<string>(periodsPerDay, ""));

    // Generate timetable using load-balancing algorithm
    for (int d = 0; d < days; d++) {
        string lastTeacher = "";

        for (int p = 0; p < periodsPerDay; p++) {

            // least-load first (fair distribution)
            sort(teachers.begin(), teachers.end(),
                 [](const Teacher &a, const Teacher &b) {
                     return a.load < b.load;
                 });

            int chosen = -1;

            // choose teacher not equal to lastTeacher (avoid consecutive)
            for (int i = 0; i < numTeachers; i++) {
                if (teachers[i].name != lastTeacher) {
                    chosen = i;
                    break;
                }
            }

            // if only 1 teacher (or no alternative), allow repetition
            if (chosen == -1) chosen = 0;

            tName[d][p] = teachers[chosen].name;
            tSub[d][p]  = teachers[chosen].subject;

            teachers[chosen].load++;
            lastTeacher = teachers[chosen].name;
        }
    }

    // Store teacher loads and names for display
    vector<int> loads;
    vector<string> names;
    for (auto &t : teachers) {
        loads.push_back(t.load);
        names.push_back(t.name);
    }

    // Return structured data - makes it easy to work with multiple timetables
    return {sectionName, tName, tSub, loads, names, periodsPerDay};
}

// ===== DISPLAY A TIMETABLE =====
// WHY: Separated display logic so we can show multiple timetables uniformly
void DisplayTimeTable(const TimeTableData& data, int timetableNumber = 0) {
    const int days = 5;
    vector<string> dayNames = {"Mon", "Tue", "Wed", "Thu", "Fri"};

    cout << "\n================== 5-DAY TIMETABLE";
    if (timetableNumber > 0) cout << " #" << timetableNumber;
    cout << " ==================\n";
    cout << "Section: " << data.sectionName << "\n\n";

    int colWidth = 18;

    cout << left << setw(10) << "Day";
    for (int p = 0; p < data.periodsPerDay; p++) {
        cout << left << setw(colWidth) << ("P" + to_string(p + 1));
    }
    cout << "\n";
    cout << string(10 + data.periodsPerDay * colWidth, '-') << "\n";

    for (int d = 0; d < days; d++) {
        cout << left << setw(10) << dayNames[d];
        for (int p = 0; p < data.periodsPerDay; p++) {
            string cell = data.tName[d][p] + "(" + data.tSub[d][p] + ")";
            cout << left << setw(colWidth) << cell;
        }
        cout << "\n";
    }

    cout << "\nTeacher Load (Whole Week):\n";
    cout << "-----------------------------\n";
    for (int i = 0; i < data.teacherNames.size(); i++) {
        cout << left << setw(15) << data.teacherNames[i] << " : " 
             << data.teacherLoads[i] << " periods\n";
    }
    cout << "-----------------------------\n";
}

// ===== MAIN TIMETABLE FUNCTION - ENHANCED WITH MULTIPLE GENERATION =====
// HOW IT WORKS:
// 1. Ask user how many timetables they want
// 2. Loop: get input for each timetable and generate it
// 3. Store all results in a vector
// 4. Display all timetables together
// 5. Optionally save to file
void TimeTable(){
    int numTimetables;
    
    cout << "\n========== TIMETABLE GENERATOR ==========\n";
    cout << "How many timetables do you want to generate? ";
    cin >> numTimetables;
    cin.ignore(); // Clear input buffer after reading integer

    // Validate input - WHY: Prevent invalid operations like 0 or negative timetables
    if (numTimetables <= 0) {
        cout << "Invalid input. Number of timetables must be greater than 0.\n";
        return;
    }

    // Vector to store all generated timetables - WHY: Allows us to process multiple at once
    vector<TimeTableData> allTimetables;

    // Generate each timetable
    for (int i = 0; i < numTimetables; i++) {
        cout << "\n\n========== TIMETABLE " << (i + 1) << " ==========\n";
        TimeTableData timetable = GenerateSingleTimeTable();
        allTimetables.push_back(timetable);
    }

    // Display all generated timetables - gives complete overview
    cout << "\n\n========== SUMMARY: ALL GENERATED TIMETABLES ==========\n";
    for (int i = 0; i < allTimetables.size(); i++) {
        DisplayTimeTable(allTimetables[i], i + 1);
        cout << "\n";
    }

    // Option to save to file - WHY: Users can reference/print timetables later
    cout << "Do you want to save all timetables to a file? (y/n): ";
    char choice;
    cin >> choice;
    
    if (choice == 'y' || choice == 'Y') {
        ofstream outFile("Timetables.txt", ios::app);
        for (int i = 0; i < allTimetables.size(); i++) {
            outFile << "\n========== TIMETABLE " << (i + 1) << " ==========\n";
            outFile << "Section: " << allTimetables[i].sectionName << "\n\n";
            outFile << "Teacher Load Summary:\n";
            for (int j = 0; j < allTimetables[i].teacherNames.size(); j++) {
                outFile << allTimetables[i].teacherNames[j] << " : " 
                       << allTimetables[i].teacherLoads[j] << " periods\n";
            }
            outFile << "\n";
        }
        outFile.close();
        cout << "Timetables saved to 'Timetables.txt'\n";
    }
}

void ShowStudentDetails(){
    ifstream Studentfile("Student.txt");
    string line;
    cout << "\n--- Student Details ---\n";
    while (getline(Studentfile, line)) {
        cout << line << endl;
    }
    Studentfile.close();
}

void showEmployeeDetails(){
    ifstream Employeefile("Employee.txt");
    string line;
    cout << "\n--- Employee Details ---\n";
    while (getline(Employeefile, line)) {
        cout << line << endl;
    }
    Employeefile.close();
}

void showTeacherDetails(){
    ifstream Teacherfile("Teacher.txt");
    string line;
    cout << "\n--- Teacher Details ---\n";
    while (getline(Teacherfile, line)) {
        cout << line << endl;
    }
    Teacherfile.close();
}

void AddStudentMarks(){
    cout << "Functionality to add student marks is not yet implemented.\n";
}

int main(){
    cout<<"------Welcome to College Management System------\n";
    int choice =0;

    while (choice !=7){
        cout<<"1. Add Student\n";
        cout<<"2. Add Employee\n";
        cout<<"3. Add Teacher\n";
        cout<<"4. Display Student/Employee/Teacher\n\n";
        cout<<"5. Add Student Marks\n";
        cout<<"6. Timetable Generator\n";
        cout<<"7. Exit\n";
        cout<<"Enter your choice:\t";
        cin >> choice;



        switch (choice){
            case 1:
                AddStudent();
                break;
            case 2:
                AddEmployee();
                break;
            case 3:
                AddTeacher();
                break;
            case 4:
                cout<<"Enter The Catagory which you want to Display:\n1. Student\n2. Employee\n3. Teacher\n";
                int x;
                cin>>x;
                switch(x){
                    case 1:
                        ShowStudentDetails();
                        break;
                    case 2:
                        showEmployeeDetails();
                        break;
                    case 3:
                        showTeacherDetails();
                        break;
                    default:
                        cout<<"Invalid choice."<<endl;
                }
                break;
            case 5:
                AddStudentMarks();
                break;
            case 6:
                TimeTable();
                break;
            case 7:
                cout << "Exiting the program." << endl;
                break;
            default:
                cout << "Invalid choice. Please try again." << endl;
        }
    }

    return 0;
}