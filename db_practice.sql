create database db_practice;
use db_practice;

-- ddl commands (Data Definition Language)--  
-- create,alter,truncate,drop,show,use,desc
 CREATE TABLE Students (
    StudentID smallINT PRIMARY KEY unique,
    Name VARCHAR(50) not null,
    Age smallINT,
    Grade CHAR(1)
);

insert into students  values(160,"sunkeerth",21,"m");
INSERT INTO Students VALUES (161, 'Priya', 22, 'F');
INSERT INTO Students VALUES (162, 'Rahul', 20, 'M');
INSERT INTO Students VALUES (163, 'Ananya', 23, 'F');
INSERT INTO Students VALUES (164, 'Vikram', 19, 'M');

select *from students;

alter table students add couse varchar(6);
insert into students  values(165,"sunkeerth",21,"m","aiml");

alter table students add marks float after age;

