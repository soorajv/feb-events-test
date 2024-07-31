FROM postgis/postgis:16-3.4

# Install build dependencies and git
RUN apt-get update && apt-get install -y \
    git \
    build-essential \
    postgresql-server-dev-16

# Clone and install pg_cron
RUN git clone https://github.com/citusdata/pg_cron.git \
    && cd pg_cron \
    && make && make install

# Cleanup
RUN apt-get purge -y \
    git \
    build-essential \
    postgresql-server-dev-16 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Update PostgreSQL configuration to load pg_cron
RUN echo "shared_preload_libraries = 'pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample
RUN echo "cron.database_name = 'event_reservation_db'" >> /usr/share/postgresql/postgresql.conf.sample
