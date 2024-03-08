**ModernMaestros Database Schema with Crow's Foot Notation **

**Users**
- Primary Key: user_id
Relationships:
- One-to-Many with Composers: This is optional. A user may not have a composer profile, so this relationship is not universally one-to-many but rather zero-or-one to many, where a user can have zero or one composer profile.
- One-to-Many with Performances: Users can participate in or be associated with multiple performances.
- One-to-Many with User Interactions: A user can initiate multiple interactions.
- One-to-Many with API Integrations: A user can have multiple API integrations.


**Composers**
- Primary Key: composer_id
- Foreign Key: user_id from Users
Relationships:
- One-to-One with Users: Each composer directly correlates to a single user. This is a specialized one-to-one relationship, as not every user becomes a composer.
- One-to-Many with Compositions: A composer can create multiple compositions.


**Compositions**
- Primary Key: composition_id
- Foreign Key: composer_id from Composers
Relationships:
- Many-to-One with Composers: Each composition is created by one composer.
- One-to-Many with Performances: A composition can be performed multiple times.
- One-to-Many with User Interactions: Compositions can be the subject of various interactions.


**Performances**
- Primary Key: performance_id
- Foreign Keys: composition_id from Compositions, user_id from Users
Relationships:
Many-to-One with Compositions: Each performance is of one composition.
Many-to-One with Users: Each performance can be associated with a user, reflecting participation or responsibility.


**User Interactions**
Primary Key: interaction_id
Foreign Keys: user_id from Users, target_id could reference either composition_id or performance_id
Relationships:
Many-to-One with Users: Each interaction is made by a user.
Many-to-One with Compositions (via target_id): Interactions can relate to specific compositions.
Many-to-One with Performances (via target_id): Interactions can also relate to specific performances.


API Integrations
Primary Key: integration_id
Foreign Key: user_id from Users
Relationships:
Many-to-One with Users: Each API integration is associated with a user.

